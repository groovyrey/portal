import { NextRequest } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as cheerio from 'cheerio';

import { db } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { getFullStudentData } from '@/lib/data-service';
import { logActivity } from '@/lib/activity-service';
import { 
  SCHOOL_INFO, 
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES, 
  IMPORTANT_OFFICES 
} from '@/lib/assistant-knowledge';

// Define tools for LangChain (optional, we use manual parsing for Gemma compatibility)
const showToastTool = tool(
  async ({ message, type = "info" }) => {
    return `Successfully triggered a ${type} toast with message: ${message}`;
  },
  {
    name: "show_toast",
    description: "Display a temporary notification (toast).",
    schema: z.object({
      message: z.string(),
      type: z.enum(["success", "error", "info", "warning"]).default("info")
    }),
  }
);

async function performWebSearch(query: string) {
  const apiKey = process.env.LANGSEARCH_API_KEY;
  if (!apiKey) {
    return "Web search is currently unavailable (API key missing).";
  }

  try {
    // 1. Initial Retrieval: Fetch 10 results
    const searchResponse = await fetch('https://api.langsearch.com/v1/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        count: 10
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('LangSearch Search Error:', searchResponse.status, errorText);
      return `Sorry, the search service is unavailable (Status: ${searchResponse.status}).`;
    }

    const searchData = await searchResponse.json();
    const initialResults = searchData.data?.webPages?.value || searchData.webPages?.value || [];
    
    if (!initialResults || initialResults.length === 0) {
      return `I searched for "${query}" but couldn't find any relevant results.`;
    }

    // 2. Semantic Reranking: Prepare documents for the Rerank API
    const documents = initialResults.map((item: any) => ({
      title: item.name || item.title || "No Title",
      url: item.url || item.link || "#",
      text: item.snippet || item.summary || "No content available."
    }));

    const rerankResponse = await fetch('https://api.langsearch.com/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        documents: documents.map((doc: any) => `${doc.title}\n${doc.text}`),
        top_n: 3,
        return_text: false
      })
    });

    let finalResults = initialResults.slice(0, 3);

    if (rerankResponse.ok) {
      const rerankData = await rerankResponse.json();
      const rerankedIndices = rerankData.data?.results || rerankData.results || [];
      
      if (rerankedIndices.length > 0) {
        finalResults = rerankedIndices.map((result: any) => initialResults[result.index]);
      }
    }

    const resultsSummary = finalResults.map((item: any, index: number) => {
      const title = item.name || item.title || "No Title";
      const link = item.url || item.link || "#";
      const snippet = item.snippet || item.summary || "No snippet available.";
      return `[${index + 1}] **${title}**\nSource: ${link}\nSnippet: ${snippet}\n`;
    }).join('\n');
    
    return `### Search results for "${query}":\n\n${resultsSummary}`;

  } catch (error) {
    console.error('Web search + rerank error:', error);
    return "An error occurred while connecting to the search service.";
  }
}

async function performWebFetch(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return `Failed to fetch the URL: ${url} (Status: ${response.status})`;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, iframe, noscript').remove();

    const title = $('title').text().trim() || 'No title';
    let content = $('article').text().trim() || $('main').text().trim() || $('body').text().trim();
    content = content.replace(/\s+/g, ' ').substring(0, 5000);

    return `### Content from: ${title}\nURL: ${url}\n\n${content}`;
  } catch (error) {
    console.error('Web fetch error:', error);
    return `An error occurred while fetching the URL: ${url}`;
  }
}

export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, timezone = 'Asia/Manila' }: { messages: Message[], timezone?: string } = await req.json();
    
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return new Response('Authentication required', { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch {
      return new Response('Invalid or expired session', { status: 401 });
    }

    await initDatabase();

    if (!db) {
      return new Response('Database connection failed', { status: 500 });
    }

    const studentData = await getFullStudentData(userId);
    if (!studentData) {
      return new Response('Student profile not found.', { status: 404 });
    }

    const scheduleItems = studentData.schedule || [];
    const financials = studentData.financials;
    const allGrades = studentData.allGrades || [];
    const gpa = studentData.gpa || 'N/A';

    let financialContext = 'No financial data found.';
    if (financials) {
      financialContext = `
- Current Balance: ${financials.balance || '0.00'}
- Total Assessment: ${financials.total || '0.00'}
- Due Today: ${financials.dueToday || '0.00'}
- Installments: ${JSON.stringify(financials.installments)}
`.trim();
    }

    const gradesContext = allGrades.length > 0 
      ? allGrades.map(g => `- ${g.code}: ${g.description} | Grade: ${g.grade} | Remarks: ${g.remarks}`).join('\n')
      : 'No grades found.';

    const scheduleContext = scheduleItems.length > 0
      ? scheduleItems.map(s => `- ${s.subject}: ${s.description} | Time: ${s.time} | Room: ${s.room}`).join('\n')
      : 'No schedule found.';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: timezone
    });
    const timeStr = now.toLocaleTimeString('en-PH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });

    const systemPrompt = `
You are the "Portal Assistant", a specialized academic advisor for ${SCHOOL_INFO.name}.

STRICT OPERATIONAL RULES:
1. **NO PROACTIVE SUMMARIES:** Never start a conversation by summarizing the student's grades, GPA, or financial balance unless specifically asked.
2. **QUICK START INTENT:** If the user sends a suggestion like "Search for Latest AI Advancement" or "Search for...", you MUST immediately call the \`web_search\` tool.
3. **WEB RESEARCH FIRST:** If the user asks about ANY topic outside of the school's internal knowledge, you MUST use the \`web_search\` tool immediately.
4. **CITE SOURCES:** When using \`web_search\` or \`web_fetch\`, synthesize results and provide Markdown links.
5. **ACTIVE FEEDBACK (TOASTS):** You MUST use the \`show_toast\` tool to provide real-time feedback for your actions. 
   - Use \`success\` when you've found specific data the user requested.
   - Use \`info\` for general status updates.
   - Use \`warning\` if something is missing but you can still help.
   - Use \`error\` ONLY for critical system failures.
   Note: The UI already shows "Thinking...", "Searching for...", and "Processing results..." automatically. Use toasts for more specific feedback like "Found your 2024 grades!" or "Summarization complete". Your toasts will be automatically prefixed with "[Assistant]: " in the UI.

---
🛠️ TOOL CALLING CONFIGURATION
If you need to use a tool, append \`|||\` followed by the JSON tool call at the VERY END of your response. 
**CRITICAL:** DO NOT wrap the tool call in markdown code blocks.

**Example:**
I'll check the web for that information.
||| {"name": "web_search", "parameters": {"query": "latest enrollment dates"}}

**Available Tools:**
\`\`\`json
[
  {
    "name": "show_toast",
    "description": "Display a temporary notification.",
    "parameters": {
      "type": "object",
      "properties": { "message": { "type": "string" }, "type": { "type": "string", "enum": ["success", "error", "info", "warning"] } },
      "required": ["message"]
    }
  },
  {
    "name": "web_search",
    "description": "Search the web for real-time information or general knowledge.",
    "parameters": {
      "type": "object",
      "properties": { "query": { "type": "string" } },
      "required": ["query"]
    }
  },
  {
    "name": "web_fetch",
    "description": "Summarize a specific URL.",
    "parameters": {
      "type": "object",
      "properties": { "url": { "type": "string" } },
      "required": ["url"]
    }
  }
]
\`\`\`
`.trim();

    const studentContext = `
STUDENT REFERENCE DATA (FOR BACKGROUND ONLY):
- Name: ${studentData.name}
- Course: ${studentData.course}
- GPA: ${gpa}
- Financials: 
${financialContext}
- Grades:
${gradesContext}
- Current Schedule:
${scheduleContext}
- School: ${SCHOOL_INFO.name}
- Current Date/Time: ${dateStr}, ${timeStr}
`.trim();

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-3-27b-it",
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      maxOutputTokens: 2048,
      streaming: true,
    });

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    // Reconstruct history with background at the top
    const history: BaseMessage[] = [];
    history.push(new HumanMessage("BACKGROUND INFORMATION:\n" + studentContext));
    history.push(new HumanMessage("SYSTEM INSTRUCTIONS & STRICT RULES:\n" + systemPrompt));
    
    // Add existing conversation history
    messages.slice(0, -1).forEach((m: any) => {
      if (m.role === 'assistant') history.push(new AIMessage(m.content));
      else history.push(new HumanMessage(m.content));
    });

    const input = messages[messages.length - 1].content;

    // Log AI interaction
    logActivity(userId, 'AI Assistant', `Asked: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`, '/assistant').catch(e => {});

    (async () => {
      let currentInput = input;
      const maxTurns = 3;
      let turn = 0;
      let isWriterClosed = false;

      try {
        while (turn < maxTurns) {
          turn++;
          const responseStream = await model.stream(
            await ChatPromptTemplate.fromMessages([
              new MessagesPlaceholder("history"),
              ["user", "{input}"],
            ]).formatMessages({ history, input: currentInput })
          );

          let fullContent = '';
          const toolCallMarker = '|||';

          for await (const chunk of responseStream) {
            const content = chunk.content as string || '';
            fullContent += content;
          }

          // Check if model called a tool
          const toolMarkerIndex = fullContent.indexOf(toolCallMarker);
          let jsonStr = '';
          let toolCallPos = -1;

          if (toolMarkerIndex !== -1) {
            jsonStr = fullContent.substring(toolMarkerIndex + toolCallMarker.length).trim();
            toolCallPos = toolMarkerIndex;
          } else {
            // Fallback: search for tool-like JSON in the whole content
            const toolPatterns = ['"web_search"', '"web_fetch"', '"show_toast"'];
            if (toolPatterns.some(p => fullContent.includes(p))) {
              const startOfJsonIndex = fullContent.lastIndexOf('{');
              const endOfJsonIndex = fullContent.lastIndexOf('}');
              
              if (startOfJsonIndex !== -1 && endOfJsonIndex !== -1 && endOfJsonIndex > startOfJsonIndex) {
                 jsonStr = fullContent.substring(startOfJsonIndex, endOfJsonIndex + 1);
                 toolCallPos = startOfJsonIndex;
              }
            }
          }

          if (jsonStr && jsonStr.includes('{')) {
            const startOfJsonIndex = jsonStr.indexOf('{');
            const endOfJsonIndex = jsonStr.lastIndexOf('}');
            
            if (startOfJsonIndex !== -1 && endOfJsonIndex !== -1 && endOfJsonIndex > startOfJsonIndex) {
              jsonStr = jsonStr.substring(startOfJsonIndex, endOfJsonIndex + 1);
            }

            try {
              const toolCall = JSON.parse(jsonStr);
              const isOurTool = ['web_search', 'web_fetch', 'show_toast'].includes(toolCall.name);
              
              if (isOurTool) {
                if (toolCall.name === 'web_search' && toolCall.parameters?.query) {
                  if (!isWriterClosed) {
                    await writer.write(encoder.encode('STATUS:SEARCHING'));
                    await writer.write(encoder.encode('\n🔍 *Searching for: "' + toolCall.parameters.query + '"...*\n\n'));
                  }
                  const result = await performWebSearch(toolCall.parameters.query);
                  if (!isWriterClosed) await writer.write(encoder.encode('STATUS:PROCESSING'));
                  history.push(new AIMessage(fullContent));
                  currentInput = `TOOL_RESULT: ${result}\n\nBased on these search results, please provide a comprehensive answer and cite your sources.`;
                  continue;
                } else if (toolCall.name === 'web_fetch' && toolCall.parameters?.url) {
                  if (!isWriterClosed) {
                    await writer.write(encoder.encode('STATUS:SEARCHING'));
                    await writer.write(encoder.encode('\n📄 *Reading page: ' + toolCall.parameters.url + '...*\n\n'));
                  }
                  const result = await performWebFetch(toolCall.parameters.url);
                  if (!isWriterClosed) await writer.write(encoder.encode('STATUS:PROCESSING'));
                  history.push(new AIMessage(fullContent));
                  currentInput = `TOOL_RESULT: ${result}\n\nBased on this page content, please provide a comprehensive summary and cite the source.`;
                  continue;
                } else {
                  // Client-side tool (toast)
                  const textBefore = fullContent.substring(0, toolCallPos).replace(/\|\|\|$/, '').trim();
                  if (textBefore && !isWriterClosed) await writer.write(encoder.encode(textBefore));
                  if (!isWriterClosed) {
                    await writer.write(encoder.encode('STATUS:FINALIZING'));
                    await writer.write(encoder.encode('\nTOOL_CALL:' + JSON.stringify(toolCall) + '\n'));
                  }
                  break;
                }
              } else {
                throw new Error("Invalid tool name");
              }
            } catch (e) {
              console.error('Tool parsing error:', e, 'Raw JSON string:', jsonStr);
              const cleanedContent = fullContent.split(toolCallMarker)[0].trim();
              if (!isWriterClosed) {
                await writer.write(encoder.encode('STATUS:FINALIZING'));
                await writer.write(encoder.encode(cleanedContent));
              }
              break;
            }
          } else {
            // Final answer turn or no tool call
            const cleanedContent = fullContent.split(toolCallMarker)[0].trim();
            if (!isWriterClosed) {
              await writer.write(encoder.encode('STATUS:FINALIZING'));
              await writer.write(encoder.encode(cleanedContent));
            }
            break;
          }
        }
      } catch (err: any) {
        console.error("Streaming error:", err);
        if (!isWriterClosed) await writer.write(encoder.encode("\n\n[Error: " + err.message + "]"));
      } finally {
        if (!isWriterClosed) {
          isWriterClosed = true;
          await writer.close();
        }
      }
    })();

    return new Response(transformStream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return new Response('Failed to process request: ' + error.message, { status: 500 });
  }
}
