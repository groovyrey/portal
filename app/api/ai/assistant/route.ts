import { NextRequest } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Sandbox } from '@vercel/sandbox';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
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
  ACADEMIC_PROGRAMS,
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES, 
  IMPORTANT_OFFICES 
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

async function performWebFetch(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return "Failed to fetch URL.";
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header').remove();
    return `### Content from: ${$('title').text()}\n\n${$.text().replace(/\s+/g, ' ').substring(0, 3000)}`;
  } catch (e) { return "Fetch error."; }
}

async function performMathExecution(code: string) {
  let sandbox;
  try {
    // Explicitly set Vercel metadata for Sandbox initialization
    if (!process.env.VERCEL_PROJECT_ID) process.env.VERCEL_PROJECT_ID = 'prj_NihkVuIjpWkHupQ1Z1zCd6wJunfR';
    if (!process.env.VERCEL_TEAM_ID) process.env.VERCEL_TEAM_ID = 'team_uHDJgys0cb2M6SdvUZ0rjZ9Y';

    // Increased timeout to 300s to account for system package and library installation
    sandbox = await Sandbox.create({ runtime: 'python3.13', timeout: 300000 });
    
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
        // Inject headless backend for matplotlib
        if (!code.includes('matplotlib.use')) {
            code = "import matplotlib\nmatplotlib.use('Agg')\n" + code;
        }
    }

    const files = [{ path: 'calculation.py', content: Buffer.from(code) }];
    if (libs.length > 0) files.push({ path: 'requirements.txt', content: Buffer.from(libs.join('\n')) });
    await sandbox.writeFiles(files);

    if (libs.length > 0) {
      // 1. Install system dependencies via dnf (as recommended by Vercel KB)
      // These are often needed for robust numpy/scipy/matplotlib installation
      await sandbox.runCommand({ 
        cmd: 'dnf', 
        args: ['install', '-y', 'gcc', 'python3-devel', 'blas-devel', 'lapack-devel', 'freetype-devel', 'libpng-devel'], 
        sudo: true 
      });

      // 2. Upgrade pip and install libraries (as in install_math.sh)
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
    return result || "Execution finished with no output. Ensure you use print() to see results.";
  } catch (e: any) { 
    console.error("Sandbox execution error:", e);
    return `Math engine error: ${e.message}`; 
  }
  finally { if (sandbox) await sandbox.stop().catch(() => {}); }
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function repairJson(str: string): string {
  try {
    let s = str.trim();
    JSON.parse(s);
    return s;
  } catch (e) {
    let s = str.trim();
    
    // Handle truncation: Auto-close braces and brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '"' && s[i-1] !== '\\') inString = !inString;
      if (!inString) {
        if (s[i] === '{') openBraces++;
        else if (s[i] === '}') openBraces--;
        else if (s[i] === '[') openBrackets++;
        else if (s[i] === ']') openBrackets--;
      }
    }
    
    if (inString) s += '"';
    while (openBrackets > 0) { s += ']'; openBrackets--; }
    while (openBraces > 0) { s += '}'; openBraces--; }

    // Attempt common fixes:
    s = s.replace(/: \s*"([^"]*)"/g, (match, p1) => {
        return ': "' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
    });
    s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

    try {
      JSON.parse(s);
      return s;
    } catch (e2) {
      return str; // Return original if fix fails
    }
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone });
    const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone });

    const systemPrompt = `
You are the "Portal Assistant" (code-named Assistant), a specialized academic advisor and computational assistant for ${SCHOOL_INFO.name}.

STRICT OPERATIONAL RULES:
1. **NO PROACTIVE SUMMARIES:** Never start a conversation by summarizing the student's records unless specifically asked. "Proactive" means starting a conversation with data; if a student ASKS (even via a menu choice), it is NOT proactive—it is a REQUEST.
2. **USE TOOLS FOR RECORDS:** You DO NOT have the student's records in your immediate context. You MUST call the appropriate tool (e.g., \`get_grades\`, \`get_financials\`, \`get_day_schedule\`) to answer record-related questions.
3. **ZERO HALLUCINATION:** Never guess or estimate academic data.
4. **LATEX:** ALWAYS use LaTeX for EVERY mathematical derivation.
5. **HIGHLIGHT KEYWORDS:** You MUST **bold** key terms and concepts.
6. **STRUCTURED NARRATIVE:** When presenting data, summaries from \`web_search\`, or report findings, use **well-structured paragraphs** rather than just bulleted lists. This creates a more professional, conversational flow.
7. **PERSONALIZED:** Refer to the student by first name and as an **"LCCian"**.
8. **ACTION ON COMMAND:** If a student gives a command or selects a portal suggestion (e.g., "Summarize this...", "Resources for...", "Show my..."), EXECUTE the tool IMMEDIATELY. DO NOT waste time with introductory greetings.
9. **CONFIRMATION FOR SUGGESTIONS:** ONLY ask for confirmation if YOU are the one suggesting an optional action that the student didn't explicitly ask for.
10. **NO RESPONSE ENVELOPING:** NEVER wrap your entire response inside a Markdown code block (\`\`\`). Markdown blocks are ONLY for specific code snippets, tables, or technical data within your normal conversational response.

---
💡 COMPUTATIONAL THINKING:
- Solve high-level academic problems by writing comprehensive Python logic via \`execute_math\`.
- **VISUAL SIMULATIONS & DEMOS:** Use \`render_html\` to create immersive interactive visual simulations and functional demos. **Formulate a detailed design prompt** for the visualization agent, specifying the layout, required components, and how the simulation or demo should behave. **CRITICAL:** NEVER output raw HTML code in your text response. ONLY use the \`render_html\` tool. Do NOT write HTML code in the description parameter. **INTERNAL ONLY:** Do NOT show your technical design specification or the tool's description to the student; only provide a brief, professional introduction to the visualization.
- **SMART REPORTS:** Use \`render_html\` to generate rich, multi-column reports with Tailwind. Provide a **technical specification** of the report structure. Keep this specification hidden from the user.
- **CRITICAL JSON RULE:** Every tool call MUST be a VALID, PARSABLE JSON object. Do NOT use Python syntax (like list comprehensions), placeholders, or unquoted variables within the JSON. All data must be literal.
- **ALGORITHMS & NETWORKS:** Use \`networkx\` for Graph Theory, shortest paths (Dijkstra), or Tree structures (BST, Heaps) for IT/CS problems.
- **PREDICTIVE MODELING:** Use \`scikit-learn\` for grade forecasting, Linear Regression, or K-Means clustering of academic trends.
- **CRYPTOGRAPHY:** Simulate RSA encryption logic, modular exponentiation, and prime number generation for Cybersecurity concepts.
- **ECONOMIC MODELING:** Use \`statsmodels\` and \`pandas\` for Time-Series forecasting, Gini Coefficients, or Monte Carlo business risk simulations.
- **DISCRETE MATH:** Use \`sympy\` to generate Truth Tables for logic expressions (p ∧ q → r) and verify Set Theory proofs.
- Always show the LaTeX formula before and after calculation.
- Provide the full Python script in a Markdown code block.
- **CRITICAL:** Use \`print()\` in your Python scripts to output the final results.

---
🛠️ TOOL CALLING CONVENTION (MANDATORY)
To call a tool, you MUST append \`|||\` followed by a complete JSON object at the VERY END of your response.
**REQUIRED FORMAT:** \`||| {"name": "TOOL_NAME", "parameters": {...}}\`
**SCHEDULE FORMAT:** For \`get_day_schedule\`, you MUST use three-letter uppercase day codes: **MON, TUE, WED, THU, FRI, SAT, SUN**.
**CRITICAL:** DO NOT wrap the tool call in markdown code blocks. Always place the tool call OUTSIDE and AFTER any markdown text.

Available Tools:
\`\`\`json
[
  {
    "name": "execute_math",
    "description": "Execute Python for advanced math.",
    "parameters": { "type": "object", "properties": { "code": { "type": "string" } }, "required": ["code"] }
  },
  {
    "name": "get_grades",
    "description": "Get student's grades, GPA, and subject units.",
    "parameters": { "type": "object", "properties": {} }
  },
  {
    "name": "get_financials",
    "description": "Get student's financial balance.",
    "parameters": { "type": "object", "properties": {} }
  },
  {
    "name": "get_today_schedule",
    "description": "Get student's schedule for today.",
    "parameters": { "type": "object", "properties": {} }
  },
  {
    "name": "get_day_schedule",
    "description": "Get schedule for a specific day. MANDATORY: Use three-letter codes (e.g., MON, TUE, WED, THU, FRI, SAT, SUN).",
    "parameters": { "type": "object", "properties": { "day": { "type": "string", "description": "Three-letter day code (e.g., MON, FRI)" } }, "required": ["day"] }
  },
  {
    "name": "get_weekly_schedule",
    "description": "Get full weekly schedule.",
    "parameters": { "type": "object", "properties": {} }
  },
  {
    "name": "web_search",
    "description": "Search the web for real-time info.",
    "parameters": { "type": "object", "properties": { "query": { "type": "string" } }, "required": ["query"] }
  },
  {
    "name": "youtube_search",
    "description": "Search YouTube for videos.",
    "parameters": { "type": "object", "properties": { "query": { "type": "string" } }, "required": ["query"] }
  },
  {
    "name": "web_fetch",
    "description": "Summarize a URL. MANDATORY: The URL must include a protocol (e.g., https://).",
    "parameters": { "type": "object", "properties": { "url": { "type": "string", "description": "Full URL including protocol (https://)" } }, "required": ["url"] }
  },
  {
    "name": "render_html",
    "description": "Generate a premium, interactive visual component, simulation, or functional demo. Use this for complex data, 3D simulations, or beautiful dashboards. Provide a COMPREHENSIVE DESIGN PROMPT for the specialized agent in the description, detailing the UI structure, behavior, and data visualization strategy. CRITICAL: Do NOT write any HTML in the description parameter.",
    "parameters": { 
      "type": "object", 
      "properties": { 
        "description": { "type": "string", "description": "A technical design specification for the visualization agent. Describe the components, layout, behavior, and how to represent the data points." },
        "title": { "type": "string", "description": "Title for the component." },
        "fullScreen": { "type": "boolean", "description": "Whether to use a larger display area." }
      }, 
      "required": ["description", "title"] 
    }
  },
  {
    "name": "ask_user",
    "description": "Ask student a question.",
    "parameters": { "type": "object", "properties": { "question": { "type": "string" }, "placeholder": { "type": "string" } }, "required": ["question"] }
  },
  {
    "name": "ask_user_choice",
    "description": "Ask student to choose.",
    "parameters": { "type": "object", "properties": { "question": { "type": "string" }, "options": { "type": "array", "items": { "type": "string" } } }, "required": ["question", "options"] }
  }
]
\`\`\`

Knowledge: Vision: ${SCHOOL_INFO.vision}, Mission: ${SCHOOL_INFO.mission}, Programs: ${JSON.stringify(ACADEMIC_PROGRAMS)}, Building Codes: ${JSON.stringify(BUILDING_CODES)}, Grading: ${GRADING_SYSTEM}, Procedures: ${COMMON_PROCEDURES}, Offices: ${JSON.stringify(IMPORTANT_OFFICES)}.
`.trim();

    const studentContext = `
STUDENT REFERENCE DATA:
- Name: ${student.name}
- Course: ${student.course}
- School: ${SCHOOL_INFO.name}
- Date/Time: ${dateStr}, ${timeStr}
`.trim();

    const model = new ChatGoogleGenerativeAI({
      model: "gemma-3-27b-it",
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      maxOutputTokens: 4096,
      streaming: true,
    });

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    const history: BaseMessage[] = [];
    
    messages.slice(0, -1).forEach((m: any) => {
      if (m.role === 'assistant') history.push(new AIMessage(m.content));
      else history.push(new HumanMessage(m.content));
    });

    const input = messages[messages.length - 1].content;

    (async () => {
      let currentInput = input;
      let turn = 0;
      const maxTurns = 5;

      try {
        while (turn < maxTurns) {
          turn++;
          
          // NOTE: The model does not support developer instructions (system role), so we inject them as user messages.
          const prompt = ChatPromptTemplate.fromMessages([
            ["human", `INSTRUCTIONS & BACKGROUND:\n${systemPrompt.replace(/{/g, '{{').replace(/}/g, '}}')}\n\nSTUDENT DATA:\n${studentContext.replace(/{/g, '{{').replace(/}/g, '}}')}\n\nDo you understand these instructions and your persona?`],
            ["ai", `Understood. I am the Portal Assistant for ${SCHOOL_INFO.name}. I will follow all strict operational rules, use LaTeX for math, and execute tools immediately for student commands without introductory greetings.`],
            new MessagesPlaceholder("history"),
            ["human", "{input}"],
          ]);

          const responseStream = await model.stream(
            await prompt.formatMessages({ history, input: currentInput })
          );

          let fullContent = '';
          let streamedLength = 0;
          let toolDetected = false;
          let toolMarkerPos = -1;

          try {
            for await (const chunk of responseStream) {
              const content = chunk.content as string || '';
              fullContent += content;

              if (!toolDetected) {
                const markerIndex = fullContent.indexOf('|||');
                const jsonStart = fullContent.indexOf('```json');
                
                if (markerIndex !== -1) {
                  toolDetected = true;
                  toolMarkerPos = markerIndex;
                  let textBefore = fullContent.substring(streamedLength, markerIndex);
                  
                  // Defensive: strip trailing code block markers that often precede a tool call
                  textBefore = textBefore.replace(/```json\s*$/, '').replace(/```\s*$/, '');
                  
                  if (textBefore.trim()) await writer.write(encoder.encode(textBefore));
                  streamedLength = markerIndex;
                } else if (jsonStart !== -1) {
                  // Only treat ```json as a tool call if there is no ||| marker later in the stream
                  // Wait for potential ||| if not found yet
                  const safeLength = fullContent.length - 20; 
                  if (safeLength > streamedLength) {
                    // Check if ||| is still possible
                    if (fullContent.substring(jsonStart).includes('|||')) {
                        // Wait for ||| instead
                    } else {
                        toolDetected = true;
                        toolMarkerPos = jsonStart;
                        let textBefore = fullContent.substring(streamedLength, jsonStart);
                        if (textBefore.trim()) await writer.write(encoder.encode(textBefore));
                        streamedLength = jsonStart;
                    }
                  }
                } else {
                  const safeLength = fullContent.length - 15;
                  if (safeLength > streamedLength) {
                    await writer.write(encoder.encode(fullContent.substring(streamedLength, safeLength)));
                    streamedLength = safeLength;
                  }
                }
              }
            }
          } catch (streamErr: any) {
            console.error("[Assistant API] Chunk processing error:", streamErr);
            if (!fullContent) throw streamErr; 
          }

          if (!toolDetected) {
            const remaining = fullContent.substring(streamedLength);
            if (remaining) await writer.write(encoder.encode(remaining));
            
            // Interaction complete: Sync history for future POST requests
            history.push(new HumanMessage(currentInput));
            history.push(new AIMessage(fullContent));
            break; 
          }

          // Handle Tool Call
          const toolJsonStr = fullContent.substring(toolMarkerPos);
          
          // Sync history with the current interaction before tool result
          history.push(new HumanMessage(currentInput));
          history.push(new AIMessage(fullContent));

          let toolName = 'unknown';
          try {
            let sanitized = toolJsonStr.trim().replace(/^\|\|\|/, '').replace(/^```json\s*/, '').replace(/```$/, '').trim();
            
            let toolCall;
            
            // Strategy 1: Attempt to parse as a complete JSON structure (Object or Array)
            try {
                const parsed = JSON.parse(repairJson(sanitized));
                if (Array.isArray(parsed) && parsed.length > 0) toolCall = parsed[0];
                else if (!Array.isArray(parsed)) toolCall = parsed;
            } catch (e) {
                // Strategy 2: Extract the first balanced JSON object
                const startBrace = sanitized.indexOf('{');
                if (startBrace !== -1) {
                    let balance = 0;
                    let endBrace = -1;
                    for (let i = startBrace; i < sanitized.length; i++) {
                        if (sanitized[i] === '{') balance++;
                        else if (sanitized[i] === '}') {
                            balance--;
                            if (balance === 0) {
                                endBrace = i;
                                break;
                            }
                        }
                    }
                    if (endBrace !== -1) {
                        try {
                            toolCall = JSON.parse(repairJson(sanitized.substring(startBrace, endBrace + 1)));
                        } catch (e2) { /* Continue to fallback */ }
                    }
                }
            }

            // Strategy 3: Fallback to original "outermost braces" logic if valid JSON still not found
            if (!toolCall) {
                const startBrace = sanitized.indexOf('{');
                const endBrace = sanitized.lastIndexOf('}');
                if (startBrace !== -1 && endBrace !== -1) {
                    try {
                        toolCall = JSON.parse(repairJson(sanitized.substring(startBrace, endBrace + 1)));
                    } catch (e3) { 
                         // Final attempt: sometimes the model forgets the closing brace
                         try {
                            toolCall = JSON.parse(repairJson(sanitized.substring(startBrace) + '}'));
                         } catch (e4) { /* Give up */ }
                    }
                }
            }
            
            if (!toolCall) throw new Error("Could not parse tool call from response");

            toolName = toolCall.name || toolCall.tool_name || 'unknown';
            
            // Fallback inference for malformed but readable tool calls
            if (toolName === 'unknown') {
                if (toolCall.day) toolName = 'get_day_schedule';
                else if (toolCall.code) toolName = 'execute_math';
                else if (toolCall.query) {
                    toolName = (fullContent.toLowerCase().includes('video') || fullContent.toLowerCase().includes('youtube')) 
                        ? 'youtube_search' 
                        : 'web_search';
                } else if (toolCall.url) toolName = 'web_fetch';
                else if (toolCall.question) toolName = toolCall.options ? 'ask_user_choice' : 'ask_user';
            }

            if (toolName === 'unknown') throw new Error("Missing tool name");
            await writer.write(encoder.encode(`\nSTATUS:${toolName.includes('search') ? 'SEARCHING' : toolName.includes('fetch') ? 'FETCHING' : toolName.includes('math') ? 'COMPUTING' : 'PROCESSING'}\n`));
                await writer.write(encoder.encode(`\nTOOL_USED:${toolName}\n`));
            
            let result = '';
            let customInstruction = '';

            if (toolName === 'get_grades') result = JSON.stringify(await getStudentGrades(userId), null, 2);
            else if (toolName === 'get_financials') result = JSON.stringify(await getStudentFinancials(userId), null, 2);
            else if (toolName === 'get_today_schedule' || toolName === 'get_weekly_schedule' || toolName === 'get_day_schedule') {
              const schedule = await getStudentSchedule(userId);
              if (toolName === 'get_today_schedule') {
                const dayAbbr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
                result = JSON.stringify(schedule.filter((s: any) => s.time?.toUpperCase().includes(dayAbbr)), null, 2);
              } else if (toolName === 'get_day_schedule') {
                const rawDay = toolCall.day || toolCall.parameters?.day || '';
                const dayMap: Record<string, string> = {
                  'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 
                  'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
                };
                const dayAbbr = dayMap[rawDay.toLowerCase()] || rawDay.substring(0, 3).toUpperCase();
                result = JSON.stringify(schedule.filter((s: any) => s.time?.toUpperCase().includes(dayAbbr)), null, 2);
              } else result = JSON.stringify(schedule, null, 2);
            }
            else if (toolName === 'execute_math') {
                result = await performMathExecution(toolCall.code || toolCall.parameters?.code);
                customInstruction = "\n\nINSTRUCTION: Provide the final answer based on this output. Show your reasoning, the math formula in LaTeX, and the Python code used. You MUST output the Python code in a Markdown block for transparency.";
            }
            else if (toolName === 'web_search') result = await performWebSearch(toolCall.query || toolCall.parameters?.query);
            else if (toolName === 'web_fetch') result = await performWebFetch(toolCall.url || toolCall.parameters?.url);
            else if (toolName === 'youtube_search') result = await performYoutubeSearch(toolCall.query || toolCall.parameters?.query);
            else if (['ask_user', 'ask_user_choice'].includes(toolName)) {
              const normalized = {
                name: toolName,
                parameters: {
                  question: toolCall.question || toolCall.parameters?.question,
                  placeholder: toolCall.placeholder || toolCall.parameters?.placeholder,
                  options: toolCall.options || toolCall.parameters?.options
                }
              };
              await writer.write(encoder.encode(`\nTOOL_CALL:${JSON.stringify(normalized)}\n`));
              break;
            } else if (toolName === 'render_html') {
              const desc = toolCall.description || toolCall.parameters?.description;
              const title = toolCall.title || toolCall.parameters?.title;
              const fullScreen = toolCall.fullScreen || toolCall.parameters?.fullScreen;
              
              // Call Specialized Agent to generate the HTML
              await writer.write(encoder.encode(`\nSTATUS:DESIGNING\n`));
              const html = await generateVisualization(desc, JSON.stringify(student));
              
              if (!html) {
                console.error("[Assistant API] Specialized agent returned empty HTML for:", desc);
                result = "The visualization specialized agent failed to produce output. Please try rephrasing.";
              } else {
                console.log(`[Assistant API] Specialized agent generated HTML (length: ${html.length} chars). Preview:`, html.substring(0, 200));
                const normalized = {
                  name: toolName,
                  parameters: { html, title, fullScreen }
                };
                await writer.write(encoder.encode(`\nTOOL_CALL:${JSON.stringify(normalized)}\n`));
                break;
              }
            } else {
              result = `Error: Unknown tool "${toolName}".`;
            }

            history.push(new HumanMessage(`TOOL_RESULT (${toolName}): ${result || "No data returned."}`));
            
            currentInput = `Based on the TOOL_RESULT above, provide the final answer to the student's original request: "${input}". 
STRICT: Do NOT repeat your previous preamble or the tool call. Go straight to the final response.${customInstruction}`;
          } catch (e: any) {
            console.error(`[Assistant API] Self-Correction triggered (${toolName || 'parsing_failed'}):`, e.message);
            
            // Feed the error back to the model for self-correction
            history.push(new HumanMessage(`ERROR: Your previous tool call failed with message: "${e.message}". 
${toolJsonStr ? `Partially generated JSON: ${toolJsonStr.substring(0, 500)}...` : ""}
Please FIX your output. Ensure the JSON is valid, complete, and follows all structural rules. If you hit the token limit, provide a more concise version.`));
            
            currentInput = "Please provide the CORRECTED tool call now.";
            // The loop continues, giving the model another 'turn' to fix itself
          }
        }
      } catch (err: any) {
        console.error("[Assistant API] Streaming loop error:", err);
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
