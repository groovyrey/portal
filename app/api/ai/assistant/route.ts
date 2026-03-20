import { NextRequest } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { Sandbox } from '@vercel/sandbox';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage, BaseMessage, ToolMessage, AIMessageChunk } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as cheerio from 'cheerio';

import { db } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { 
  getStudentProfile, 
  getStudentSchedule, 
  getStudentFinancials, 
  getStudentGrades 
} from '@/lib/data-service';
import { generateVisualization } from '@/lib/ai-service';
import { query } from '@/lib/turso';
import { 
  SCHOOL_INFO, 
  GRADING_SYSTEM, 
} from '@/lib/assistant-knowledge';

export const maxDuration = 300;

/**
 * TOOLS IMPLEMENTATION
 */

async function performYoutubeSearch(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return "YouTube search is currently unavailable (API key missing).";

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return "YouTube search error.";
    const data = await response.json();
    return (data.items || []).map((item: any, i: number) => 
      `[Video ${i + 1}] **${item.snippet.title}**\nChannel: ${item.snippet.channelTitle}\nLink: https://www.youtube.com/watch?v=${item.id.videoId}`
    ).join('\n\n');
  } catch (e) { return "YouTube search timed out."; }
}

async function performWebSearch(query: string) {
  const apiKey = process.env.LANGSEARCH_API_KEY;
  if (!apiKey) return "Web search unavailable (API key missing).";
  try {
    const response = await fetch('https://api.langsearch.com/v1/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ query, count: 5 }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return "Search service error.";
    const data = await response.json();
    const results = data.data?.webPages?.value || [];
    return results.map((r: any, i: number) => `[${i+1}] **${r.name}**\nSource: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n');
  } catch (e) { return "Web search timed out."; }
}

async function performMathExecution(code: string) {
  let sandbox;
  try {
    if (!process.env.VERCEL_PROJECT_ID) process.env.VERCEL_PROJECT_ID = 'prj_NihkVuIjpWkHupQ1Z1zCd6wJunfR';
    if (!process.env.VERCEL_TEAM_ID) process.env.VERCEL_TEAM_ID = 'team_uHDJgys0cb2M6SdvUZ0rjZ9Y';

    sandbox = await Sandbox.create({ runtime: 'python3.13', timeout: 180000 }); // 3 min
    
    const libs = [];
    if (code.includes('sympy')) libs.push('sympy');
    if (code.includes('numpy')) libs.push('numpy');
    if (code.includes('scipy')) libs.push('scipy');
    if (code.includes('pandas')) libs.push('pandas');
    if (code.includes('sklearn') || code.includes('scikit-learn')) libs.push('scikit-learn');
    if (code.includes('statsmodels')) libs.push('statsmodels');
    if (code.includes('seaborn')) libs.push('seaborn');
    if (code.includes('mpmath')) libs.push('mpmath');
    if (code.includes('networkx')) libs.push('networkx');
    if (code.includes('matplotlib')) {
        libs.push('matplotlib');
        if (!code.includes('matplotlib.use')) {
            code = "import matplotlib\nmatplotlib.use('Agg')\n" + code;
        }
    }

    const files = [{ path: 'calculation.py', content: Buffer.from(code) }];
    if (libs.length > 0) files.push({ path: 'requirements.txt', content: Buffer.from(libs.join('\n')) });
    await sandbox.writeFiles(files);

    if (libs.length > 0) {
      // Skip dnf install to save time; use --only-binary if needed or assume environment has basics
      await sandbox.runCommand({ 
        cmd: 'pip', 
        args: ['install', '--upgrade', 'pip', '--quiet'], 
        sudo: true 
      });
      
      await sandbox.runCommand({ 
        cmd: 'pip', 
        args: ['install', '-r', 'requirements.txt', '--quiet'], 
        sudo: true 
      });
    }
    
    const execution = await sandbox.runCommand({ cmd: 'python3', args: ['calculation.py'] });
    const output = await execution.stdout();
    const errorOutput = await execution.stderr();
    
    const result = (output + (errorOutput ? `\nERRORS:\n${errorOutput}` : '')).trim();
    return result || "Execution finished with no output. Use print() to see results.";
  } catch (e: any) { 
    console.error("Sandbox execution error:", e);
    return `Math engine error: ${e.message}`; 
  }
  finally { if (sandbox) await sandbox.stop().catch(() => {}); }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, timezone = 'Asia/Manila' }: { messages: Message[], timezone?: string } = await req.json();
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) return new Response('Unauthorized', { status: 401 });

    let userId = "";
    try {
      userId = JSON.parse(decrypt(sessionCookie.value)).userId;
    } catch { return new Response('Invalid session', { status: 401 }); }

    await initDatabase();
    const student = await getStudentProfile(userId);
    if (!student) return new Response('Profile not found', { status: 404 });

    const assistantSettings = student.settings?.assistant || {
      saveHistory: true,
      contextAwareness: true,
      showThinkingProcess: true
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone });
    const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone });

    // Define Tools with Zod Schemas
    const tools = [
      tool(async ({ code }) => await performMathExecution(code), {
        name: "execute_math",
        description: "Execute Python for advanced math.",
        schema: z.object({ code: z.string().describe("The Python code to execute") })
      }),
      tool(async () => JSON.stringify(await getStudentGrades(userId)), {
        name: "get_grades",
        description: "Get student's grades and GPA.",
        schema: z.object({})
      }),
      tool(async () => JSON.stringify(await getStudentFinancials(userId)), {
        name: "get_financials",
        description: "Get student's financial balance.",
        schema: z.object({})
      }),
      tool(async () => {
        const schedule = await getStudentSchedule(userId);
        const dayAbbr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
        return JSON.stringify(schedule.filter((s: any) => s.time?.toUpperCase().includes(dayAbbr)));
      }, {
        name: "get_today_schedule",
        description: "Get schedule for today.",
        schema: z.object({})
      }),
      tool(async ({ day }) => {
        const schedule = await getStudentSchedule(userId);
        const dayMap: Record<string, string> = {
          'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 
          'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
        };
        const dayAbbr = dayMap[day.toLowerCase()] || day.substring(0, 3).toUpperCase();
        return JSON.stringify(schedule.filter((s: any) => s.time?.toUpperCase().includes(dayAbbr)));
      }, {
        name: "get_day_schedule",
        description: "Get schedule for a specific day.",
        schema: z.object({ day: z.string().describe("Day of the week (e.g., 'Monday', 'MON')") })
      }),
      tool(async ({ query }) => await performWebSearch(query), {
        name: "web_search",
        description: "Search the web for info.",
        schema: z.object({ query: z.string() })
      }),
      tool(async ({ description, title }) => {
         const fullData = await getStudentGrades(userId);
         return await generateVisualization(description, JSON.stringify(fullData));
      }, {
        name: "render_html",
        description: "Generate interactive, animated, and responsive visual components, simulations, and educational demos.",
        schema: z.object({ 
          description: z.string().describe("Description of the visualization"),
          title: z.string().describe("Title of the component")
        })
      })
    ];

    const systemPrompt = `
You are the "Portal Assistant", a sophisticated academic advisor and computational engine for ${SCHOOL_INFO.name}.

### CORE DIRECTIVES
1.  **Professionalism:** Maintain a formal, academic, and supportive tone. Be concise and precise. Avoid casual slang or excessive emojis.
2.  **Data-Driven:** Base all answers strictly on the data provided by tools. **Do not hallucinate** grades, schedules, or financial details. If data is missing, state it clearly.
3.  **Tool Usage:** You must use the provided tools to fetch student data (grades, schedule, financials) or perform calculations.
4.  **Math & Science:**
    *   ALWAYS use **LaTeX** for mathematical expressions (e.g., $E = mc^2$).
    *   Show step-by-step derivations for complex problems.
    *   Use the \`execute_math\` tool for any non-trivial calculation.
5.  **Visualization & Simulation:**
    *   **Proactively use the \`render_html\` tool** to create interactive demonstrations, 2D physics simulations, or dynamic charts for any concept that benefits from visual explanation.
    *   Do not just describe a phenomenon; **show it** with code.
    *   Prioritize this for science (physics, chemistry), math (graphs, geometry), and financial data visualization.
6.  **Personalization:**
    *   Refer to the student by their **first name** (e.g., "Hello Juan").
    *   Refer to them as an **"LCCian"** where appropriate to build community spirit.
7.  **Formatting:**
    *   Use **bold** for key concepts, dates, and figures.
    *   Use bullet points for lists to improve readability.
    *   Keep paragraphs short and focused.

### OPERATIONAL CONSTRAINTS
*   **No Proactive Summaries:** Do not list all student data at the start of a conversation. Wait for a specific question.
*   **Privacy:** Only discuss the logged-in student's data.
*   **Identity:** You are an AI assistant for LCC, not a human.

Knowledge Base: ${SCHOOL_INFO.name}, Vision: ${SCHOOL_INFO.vision}, Grading System: ${GRADING_SYSTEM}.
`.trim();

    const studentContext = `
STUDENT DATA:
- Name: ${student.name}
- Course: ${student.course}
- Date: ${dateStr}, ${timeStr}
`.trim();

    const model = new ChatOpenAI({
      model: "@cf/moonshotai/kimi-k2.5",
      apiKey: process.env.ASSISTANT_KEY || '',
      configuration: {
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.ASSISTANT_ID}/ai/v1`,
      },
      maxTokens: 4096,
      streaming: true,
      temperature: 0.3, 
    }).bindTools(tools);

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    const history: BaseMessage[] = [];
    // Load ALL messages into history, including the latest one.
    // If not saving history, at least load the current user message.
    const messagesToLoad = assistantSettings.saveHistory ? messages : [messages[messages.length - 1]];

    messagesToLoad.forEach((m: any) => {
      if (m.role === 'assistant') history.push(new AIMessage(m.content));
      else history.push(new HumanMessage(m.content));
    });

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "{system_prompt}\n\n{student_context}"],
        new MessagesPlaceholder("history"),
    ]);

    (async () => {
      let turn = 0;
      const maxTurns = 5;

      try {
        while (turn < maxTurns) {
          turn++;
          
          const chain = promptTemplate.pipe(model);
          const stream = await chain.stream({
              history,
              system_prompt: systemPrompt,
              student_context: studentContext,
          });

          let aggregatedChunk: AIMessageChunk | null = null;
          let fullContent = "";
          let isBuffering = false;
          
          for await (const chunk of stream) {
            if (!aggregatedChunk) {
                aggregatedChunk = chunk as AIMessageChunk;
            } else {
                aggregatedChunk = aggregatedChunk.concat(chunk) as AIMessageChunk;
            }

            const content = chunk.content;
            let textChunk = "";
            
            if (typeof content === 'string') {
                textChunk = content;
            } else if (Array.isArray(content)) {
                 for (const part of content) {
                     if (part.type === 'text' && typeof part.text === 'string') {
                         textChunk += part.text;
                     }
                 }
            }
            
            if (textChunk) {
                fullContent += textChunk;
                
                // Start buffering if the very first character (trimmed) is '{'
                if (fullContent.trim().length > 0 && fullContent.trim().startsWith('{')) {
                    isBuffering = true;
                }
                
                // If we are NOT buffering, stream immediately
                if (!isBuffering) {
                    await writer.write(encoder.encode(textChunk));
                }
            }
          }
          
          let collectedToolCalls = aggregatedChunk?.tool_calls || [];
          const collectedContent = aggregatedChunk?.content || "";

          // Fallback: Check if the buffered content is a raw JSON tool call
          if (collectedToolCalls.length === 0 && isBuffering) {
              try {
                  // Attempt to parse the full content as JSON
                  // We use a regex to extract the JSON object in case there's extra whitespace/text
                  const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                      const parsed = JSON.parse(jsonMatch[0]);
                      if (parsed.name) {
                          collectedToolCalls = [{
                              name: parsed.name,
                              args: parsed.arguments || parsed.parameters || parsed.args || {},
                              id: `call_${Date.now()}`,
                              type: 'tool_call'
                          }];
                          // Valid tool call found in buffer. Do NOT flush to user.
                      } else {
                          // Valid JSON but not a tool call? Flush it.
                          await writer.write(encoder.encode(fullContent));
                      }
                  } else {
                      // Not valid JSON. Flush it.
                      await writer.write(encoder.encode(fullContent));
                  }
              } catch (e) {
                  // Parsing failed. Flush the buffer.
                  await writer.write(encoder.encode(fullContent));
              }
          } else if (isBuffering && collectedToolCalls.length > 0) {
              // Standard tool calls were detected by the model, but we buffered the text.
              // The text might be an explanation or the tool call itself.
              // If it's the tool call JSON, we shouldn't flush it.
              // If it's "Thinking...", we might want to.
              // For now, if tool calls exist, we usually suppress the text if it looks like JSON.
               if (!fullContent.trim().startsWith('{')) {
                   await writer.write(encoder.encode(fullContent));
               }
          }

          if (collectedToolCalls.length > 0) {
            // It was a tool call turn.
            // 1. Add AIMessage with tool calls to history
            const aiMsg = new AIMessage({
                content: collectedContent,
                tool_calls: collectedToolCalls
            });
            history.push(aiMsg);

            // 2. Execute tools
            // (Thinking process message removed as per request)

            for (const toolCall of collectedToolCalls) {
                // Notify Client of Tool Usage
                await writer.write(encoder.encode(`TOOL_USED: ${toolCall.name}\n`));

                const selectedTool = tools.find(t => t.name === toolCall.name);
                let output = "Error: Tool not found.";
                if (selectedTool) {
                    try {
                        output = await (selectedTool as any).invoke(toolCall.args);
                        
                        // Special Handling for Client UI (render_html)
                        if (toolCall.name === 'render_html') {
                             const clientPayload = {
                                 name: 'render_html',
                                 parameters: {
                                     html: output,
                                     title: toolCall.args.title || 'Visualization',
                                     fullScreen: false
                                 }
                             };
                             await writer.write(encoder.encode(`TOOL_CALL: ${JSON.stringify(clientPayload)}\n`));
                        }

                    } catch (e: any) {
                        output = `Tool Execution Error: ${e.message}`;
                    }
                }
                history.push(new ToolMessage({
                    tool_call_id: toolCall.id!,
                    content: output,
                    name: toolCall.name
                }));
            }
            // Loop continues to generate response based on tool outputs
          } else {
            // No tool calls, we are done.
            history.push(new AIMessage(collectedContent));
            break;
          }
        }
      } catch (err: any) {
        console.error("Agent Error:", err);
        await writer.write(encoder.encode(`\n\n[System Error: ${err.message}]`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(transformStream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    console.error("[Assistant API] Fatal POST error:", error);
    return new Response('Error: ' + error.message, { status: 500 });
  }
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
