import { NextRequest } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
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
  getStudentGrades,
  getFullStudentData
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

async function performWebFetch(url: string) {
  try {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, { 
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) return `Failed to fetch URL: ${response.statusText} (${response.status})`;
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script, style, and navigation elements
    $('script, style, nav, footer, header, noscript, iframe').remove();
    
    // Extract Links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, targetUrl).toString();
          links.push(`${text}: ${absoluteUrl}`);
        } catch (e) {}
      }
    });

    let text = $('body').text().replace(/\s+/g, ' ').trim();
    if (text.length > 4000) text = text.substring(0, 4000) + '... [Truncated]';
    
    const linksText = links.length > 0 ? `\n\nLINKS FOUND:\n${links.slice(0, 20).join('\n')}` : "";
    
    return (text || "No readable content found.") + linksText;
  } catch (e: any) {
    return `Error fetching URL: ${e.message}`;
  }
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
      tool(async () => {
        const data = await getFullStudentData(userId);
        return JSON.stringify(data);
      }, {
        name: "get_full_student_data",
        description: "Get all student data (profile, grades, GPA, schedule, financials) in one call.",
        schema: z.object({})
      }),
      tool(async ({ query }) => await performWebSearch(query), {
        name: "web_search",
        description: "Search the web for info.",
        schema: z.object({ query: z.string() })
      }),
      tool(async ({ url }) => await performWebFetch(url), {
        name: "web_fetch",
        description: "Fetch and read the content of a specific URL.",
        schema: z.object({ url: z.string().describe("The URL to fetch") })
      }),
      tool(async ({ query }) => await performYoutubeSearch(query), {
        name: "youtube_search",
        description: "Search YouTube for educational videos.",
        schema: z.object({ query: z.string() })
      }),
      tool(async ({ question, options }) => {
        return `Presented user with options: ${options.join(', ')}. Waiting for selection...`;
      }, {
        name: "ask_user_choice",
        description: "Present the user with a set of options to choose from. Use this when there are multiple valid paths or specific categories to filter.",
        schema: z.object({ 
          question: z.string().describe("The question or instruction for the user"),
          options: z.array(z.string()).describe("List of options for the user to select from")
        })
      }),
      tool(async ({ question, placeholder }) => {
        return `Asked user: "${question}". Waiting for response...`;
      }, {
        name: "ask_user",
        description: "Ask the user for specific text input, clarification, or missing details. Use this when you need more information to proceed.",
        schema: z.object({ 
          question: z.string().describe("The question to ask the user"),
          placeholder: z.string().optional().describe("Hint for the input field")
        })
      }),
      tool(async ({ description, title }) => {
         const [grades, financials, schedule] = await Promise.all([
           getStudentGrades(userId),
           getStudentFinancials(userId),
           getStudentSchedule(userId)
         ]);
         
         const combinedContext = JSON.stringify({ grades, financials, schedule });
         return await generateVisualization(description, combinedContext);
      }, {
        name: "render_html",
        description: "Generate interactive, animated, and fully responsive visual components, simulations, and educational demos.",
        schema: z.object({ 
          description: z.string().describe("EXTREMELY DETAILED description for the Visualization Agent. Include specific UI requirements, interactive elements, physics parameters, color schemes, and expected behavior. IMPORTANT: Mandate FULL RESPONSIVENESS so it fits perfectly on any screen size (mobile, tablet, desktop). This is a prompt for another AI to generate code."),
          title: z.string().describe("Title of the component")
        })
      })
    ];

    const systemPrompt = `
You are the "Portal Assistant", a sophisticated academic advisor and computational engine for ${SCHOOL_INFO.name}.

### CORE DIRECTIVES
1.  **Professionalism & Engagement:** Maintain a formal yet supportive tone. Your responses should be **informative and engaging**. Provide detailed explanations and additional context when helpful, but avoid being unnecessarily verbose.
2.  **Data-Driven Insights:** Base all answers strictly on the data provided by tools. **Do not hallucinate**. When you fetch data (like grades or financials), don't just list them—**analyze them** and provide helpful insights or advice.
3.  **Tool Usage:** Use provided tools for student data or math. Output ONLY the tool call prefix "|||" and the JSON if you need to call a tool. Wait for tool results before final answer.
4.  **Math & Science:**
    *   ALWAYS use **LaTeX** for mathematical expressions (e.g., $E = mc^2$).
    *   Show step-by-step derivations for complex problems. Be thorough in your explanations.
    *   Use the \`execute_math\` tool for any non-trivial calculation.
5.  **Visualization & Simulation:**
    *   **Proactively use the \`render_html\` tool** for simulations, demos, or dynamic charts.
    *   Do not just describe a phenomenon; **show it** with code. If a student asks about a concept, create a visual aid for it.
    *   **Crucial:** When using \`render_html\`, the \`description\` argument in the tool call MUST be an **EXTREMELY DETAILED technical prompt** for a specialized visualization agent. Describe UI layout, interactive controls, animations, color palette, and any mathematical or physical laws the simulation must follow.
    *   **Responsiveness:** Explicitly instruct the agent to make the visualization **FULLY RESPONSIVE** and mobile-friendly so it fits perfectly on any screen size.
    *   In your response to the student, provide a **detailed, engaging, and educational description** explaining what the visualization represents, how to interact with it, and the key concepts it demonstrates. Do not just output the tool call; explain the "why" and "how" behind it.
6.  **Personalization:**
    *   Refer to the student by their **first name** (e.g., "Hello Juan").
    *   Refer to them as an **"LCCian"** where appropriate.
7.  **Formatting:**
    *   **Markdown:** Proactively use **Markdown** (including tables, bold text, and lists) for all responses to ensure high readability and visual appeal.
    *   Use **bold** for key concepts, dates, and figures.
    *   Use bullet points for lists.
    *   **Structure:** Use headers (###) to organize responses into logical sections.

### TOOLS PROTOCOL
To call a tool, you MUST output ONLY the "|||" prefix followed by a single JSON object.
**CRITICAL:** 
- NO conversational text before or after the tool call.
- NO markdown code blocks (e.g., no \`\`\`json).
- Example: ||| { "name": "get_grades", "args": {} }
Wait for the tool result before giving your final response to the student.

AVAILABLE TOOLS:
1. execute_math: { "code": string } - Execute Python for advanced math.
2. get_grades: {} - Get student's grades and GPA.
3. get_financials: {} - Get student's financial balance.
4. get_today_schedule: {} - Get schedule for today.
5. get_day_schedule: { "day": string } - Get schedule for a specific day.
6. web_search: { "query": string } - Search the web for information.
7. web_fetch: { "url": string } - Fetch and read the content of a specific URL.
8. youtube_search: { "query": string } - Search YouTube for educational videos.
9. get_full_student_data: {} - Get all student info (grades, gpa, schedule, financials) at once.
10. ask_user_choice: { "question": string, "options": string[] } - Show options to user.
11. ask_user: { "question": string, "placeholder": string } - Ask user for input.
12. render_html: { "description": string, "title": string } - Create visualizations.

### OPERATIONAL CONSTRAINTS
*   **No Proactive Summaries:** Do not list all student data at the start. Wait for questions.
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

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-3-27b-it",
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      maxOutputTokens: 4096,
      streaming: true,
      temperature: 0.3, 
    });

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    const history: BaseMessage[] = [];
    
    // Gemma 3 workaround: System prompt as Human message at the very beginning
    history.push(new HumanMessage(`${systemPrompt}\n\n${studentContext}`));
    history.push(new AIMessage("Understood. I am now initialized as the LCC Portal Assistant. I will use the tool calling format provided. How can I help you?"));

    // Load messages into history
    const messagesToLoad = assistantSettings.saveHistory ? messages : [messages[messages.length - 1]];

    messagesToLoad.forEach((m: any) => {
      if (m.role === 'assistant') history.push(new AIMessage(m.content));
      else if (m.role === 'user') history.push(new HumanMessage(m.content));
    });

    const promptTemplate = ChatPromptTemplate.fromMessages([
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
          });

          let aggregatedChunk: AIMessageChunk | null = null;
          let fullContent = "";
          let isBuffering = false;
          let lastWrittenIndex = 0;
          
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
                
                const toolMatch = fullContent.substring(lastWrittenIndex).match(/\|{2,3}/);
                
                if (toolMatch) {
                    const relativeIndex = toolMatch.index!;
                    const absoluteIndex = lastWrittenIndex + relativeIndex;
                    
                    if (!isBuffering) {
                        // Write everything up to the start of the ||| marker
                        if (absoluteIndex > lastWrittenIndex) {
                            const toWrite = fullContent.substring(lastWrittenIndex, absoluteIndex);
                            await writer.write(encoder.encode(toWrite));
                            lastWrittenIndex = absoluteIndex;
                        }
                        isBuffering = true;
                    }
                } else if (!isBuffering) {
                    // Normal streaming: write the chunk and update lastWrittenIndex
                    await writer.write(encoder.encode(textChunk));
                    lastWrittenIndex = fullContent.length;
                }
            }
          }

          console.log(`[Assistant Response Turn ${turn}]:`, fullContent);
          
          let collectedToolCalls = aggregatedChunk?.tool_calls || [];
          const collectedContent = aggregatedChunk?.content || "";

          // Fallback: Check if the buffered content is a raw JSON tool call
          if (collectedToolCalls.length === 0 && isBuffering) {
              try {
                  const bufferedPart = fullContent.substring(lastWrittenIndex).trim();
                  // More robust regex: find ALL ||| blocks and extract JSON from each
                  const toolBlocks = bufferedPart.split(/\|{2,3}/).filter(block => block.trim().length > 0);
                  
                  for (const block of toolBlocks) {
                      const jsonBlockMatch = block.match(/(\{[\s\S]*\})/);
                      if (jsonBlockMatch) {
                          try {
                              let jsonStr = jsonBlockMatch[1];
                              // Clean up potential markdown artifacts
                              jsonStr = jsonStr.replace(/```json\s?/, '').replace(/```\s?/, '');

                              // Sanitize unescaped backslashes
                              const sanitizedJson = jsonStr.replace(/\\(?!"|\\|\/|b|f|n|r|t|u[0-9a-fA-F]{4})/g, "\\\\");

                              const parsed = JSON.parse(sanitizedJson);
                              
                              if (parsed.name) {
                                  let args = {};
                                  if (parsed.args && typeof parsed.args === 'object') args = parsed.args;
                                  else if (parsed.arguments && typeof parsed.arguments === 'object') args = parsed.arguments;
                                  else if (parsed.parameters && typeof parsed.parameters === 'object') args = parsed.parameters;
                                  else {
                                      const { name, ...rest } = parsed;
                                      args = rest;
                                  }

                                  collectedToolCalls.push({
                                      name: parsed.name as any,
                                      args: args,
                                      id: `call_${Date.now()}_${collectedToolCalls.length}`,
                                      type: 'tool_call' as const
                                  });
                              } else {
                                  // HEURISTIC: Check if it's a tool call missing the 'name' field
                                  // 1. Check for single key as tool name
                                  const keys = Object.keys(parsed);
                                  const knownToolNames = tools.map(t => t.name);

                                  if (keys.length === 1 && (knownToolNames as string[]).includes(keys[0])) {
                                      const toolName = keys[0];
                                      collectedToolCalls.push({
                                          name: toolName as any,
                                          args: typeof parsed[toolName] === 'object' ? parsed[toolName] : {},
                                          id: `call_${Date.now()}_${collectedToolCalls.length}`,
                                          type: 'tool_call' as const
                                      });
                                  } 
                                  // 2. Check for render_html signature (description + title)
                                  else if (parsed.description && parsed.title) {
                                      collectedToolCalls.push({
                                          name: 'render_html',
                                          args: parsed,
                                          id: `call_${Date.now()}_${collectedToolCalls.length}`,
                                          type: 'tool_call' as const
                                      });
                                  }
                                  // 3. Check for execute_math signature (code)
                                  else if (parsed.code && (parsed.code.includes('import') || parsed.code.includes('print'))) {
                                      collectedToolCalls.push({
                                          name: 'execute_math',
                                          args: { code: parsed.code },
                                          id: `call_${Date.now()}_${collectedToolCalls.length}`,
                                          type: 'tool_call' as const
                                      });
                                  }
                              }
                          } catch (e) {
                              console.error("JSON parse error in tool block:", e);
                          }
                      }
                  }
                  
                  if (collectedToolCalls.length === 0) {
                      await writer.write(encoder.encode(bufferedPart.replace(/^\|+/, '').trim()));
                  }
              } catch (e) {
                  await writer.write(encoder.encode(fullContent.substring(lastWrittenIndex).replace(/^\|+/, '').trim()));
              }
          } else if (isBuffering && collectedToolCalls.length > 0) {
              // Standard tool calls were detected by the model, but we buffered the text.
              // The text might be an explanation or the tool call itself.
              // If it's the tool call JSON, we shouldn't flush it.
               const bufferedPart = fullContent.substring(lastWrittenIndex).trim();
               if (!bufferedPart.startsWith('{') && !bufferedPart.startsWith('|')) {
                   await writer.write(encoder.encode(bufferedPart));
               }
          }

          if (collectedToolCalls.length > 0) {
            // It was a tool call turn.
            // Add AIMessage with the raw content (which contains the tool call JSON)
            history.push(new AIMessage(fullContent));

            for (const toolCall of collectedToolCalls) {
                // Notify Client of Tool Usage
                await writer.write(encoder.encode(`TOOL_USED: ${toolCall.name}\n`));

                const selectedTool = tools.find(t => t.name === toolCall.name);
                let output = "Error: Tool not found.";
                let shouldStopAfterTool = false;

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
                        
                        // Handle Interaction Tools
                        if (toolCall.name === 'ask_user' || toolCall.name === 'ask_user_choice') {
                             const clientPayload = {
                                 name: toolCall.name,
                                 parameters: toolCall.args
                             };
                             await writer.write(encoder.encode(`TOOL_CALL: ${JSON.stringify(clientPayload)}\n`));
                             shouldStopAfterTool = true;
                        }

                    } catch (e: any) {
                        output = `Tool Execution Error: ${e.message}`;
                    }
                }
                
                // Add tool result as a HumanMessage to the history
                history.push(new HumanMessage(`TOOL_RESULT (${toolCall.name}): ${output}`));

                if (shouldStopAfterTool) {
                    // Force break the turn loop to wait for user interaction
                    turn = maxTurns; 
                    break;
                }
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
