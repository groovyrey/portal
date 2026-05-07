import { NextRequest } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Sandbox } from '@vercel/sandbox';
import * as cheerio from 'cheerio';

import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { 
  getStudentProfile, 
  getStudentSchedule, 
  getStudentFinancials, 
  getStudentGrades,
  getFullStudentData
} from '@/lib/data-service';
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
  if (!apiKey) return "YouTube search is currently unavailable.";
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`);
    const data = await response.json();
    return (data.items || []).map((item: any, i: number) => `[Video ${i + 1}] **${item.snippet.title}**\nLink: https://www.youtube.com/watch?v=${item.id.videoId}`).join('\n\n');
  } catch (e) { return "YouTube search error."; }
}

async function performWebSearch(query: string) {
  const apiKey = process.env.LANGSEARCH_API_KEY;
  if (!apiKey) return "Web search unavailable.";
  try {
    const response = await fetch('https://api.langsearch.com/v1/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ query, count: 5 })
    });
    const data = await response.json();
    const results = data.data?.webPages?.value || [];
    return results.map((r: any, i: number) => `[${i+1}] **${r.name}**\nSource: ${r.url}\nSnippet: ${r.snippet}`).join('\n\n');
  } catch (e) { return "Web search error."; }
}

async function performWikipediaSearch(query: string) {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
    const searchData = await searchRes.json();
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return "No article found.";
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, '_'))}`);
    const data = await summaryRes.json();
    return `**${data.title}**\n\n${data.extract}`;
  } catch (e) { return "Wikipedia error."; }
}

async function performMathExecution(code: string) {
  let sandbox;
  try {
    sandbox = await Sandbox.create({ runtime: 'python3.13', timeout: 180000 });
    const libs = [];
    if (code.includes('sympy')) libs.push('sympy');
    if (code.includes('numpy')) libs.push('numpy');
    if (code.includes('scipy')) libs.push('scipy');
    if (code.includes('pandas')) libs.push('pandas');
    if (code.includes('matplotlib')) {
        libs.push('matplotlib');
        if (!code.includes('matplotlib.use')) code = "import matplotlib\nmatplotlib.use('Agg')\n" + code;
    }
    const files = [{ path: 'calculation.py', content: Buffer.from(code) }];
    if (libs.length > 0) files.push({ path: 'requirements.txt', content: Buffer.from(libs.join('\n')) });
    await sandbox.writeFiles(files);
    if (libs.length > 0) {
      await sandbox.runCommand({ cmd: 'pip', args: ['install', '--upgrade', 'pip', '--quiet'], sudo: true });
      await sandbox.runCommand({ cmd: 'pip', args: ['install', '-r', 'requirements.txt', '--quiet'], sudo: true });
    }
    const execution = await sandbox.runCommand({ cmd: 'python3', args: ['calculation.py'] });
    const output = await execution.stdout();
    const errorOutput = await execution.stderr();
    return (output + (errorOutput ? `\nERRORS:\n${errorOutput}` : '')).trim() || "Execution finished with no output.";
  } catch (e: any) { return `Math engine error: ${e.message}`; }
  finally { if (sandbox) await sandbox.stop().catch(() => {}); }
}

async function performWebFetch(url: string) {
  try {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
    const response = await fetch(targetUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header').remove();
    return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 4000);
  } catch (e: any) { return `Fetch error: ${e.message}`; }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) return new Response('Unauthorized', { status: 401 });

    const { userId } = JSON.parse(decrypt(sessionCookie.value));
    console.log(`[Assistant] Request for user ${userId}`);
    
    // Non-blocking DB init - don't crash the assistant if Turso is down
    initDatabase().catch(e => console.error('[Assistant] DB Init non-fatal error:', e.message));
    
    const student = await getStudentProfile(userId);
    if (!student) {
      console.error(`[Assistant] Profile not found for ${userId}`);
      return new Response('Profile not found', { status: 404 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
    const modelId = "gemma-4-26b-a4b-it";
    console.log(`[Assistant] Initializing model: ${modelId}`);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: `You are the "LCCian Companion" for ${SCHOOL_INFO.name}. 
Today's date is ${today}.
Address user as ${student.name.split(' ')[0]}. 
Be concise and helpful. Avoid repeating yourself.
Use Markdown Tables for structured data.
Base answers ONLY on tool data or provided context.

STRICT REASONING PROTOCOL: 
1. You MUST always start your response with a <thought> block.
2. Inside <thought>...</thought>, you MUST analyze the user's intent, plan your tools calls, and draft your final response.
3. Everything outside the <thought> tags MUST be the final, student-facing answer only.
4. DO NOT repeat your reasoning, intent, or plan in the final answer.
5. If you do not need to call tools, still use <thought> to plan your reply.

Example:
<thought>The user wants to know their balance. I will use get_financials.</thought>Your current balance is...

Context: Vision: ${SCHOOL_INFO.vision}, Grading: ${GRADING_SYSTEM}.`,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
    });

    const toolMap: any = {
      execute_math: async (args: any) => await performMathExecution(args.code),
      get_grades: async () => JSON.stringify(await getStudentGrades(userId)),
      get_financials: async () => JSON.stringify(await getStudentFinancials(userId)),
      get_weekly_schedule: async () => JSON.stringify(await getStudentSchedule(userId)),
      web_search: async (args: any) => await performWebSearch(args.query),
      web_fetch: async (args: any) => await performWebFetch(args.url),
      youtube_search: async (args: any) => await performYoutubeSearch(args.query),
      wikipedia_search: async (args: any) => await performWikipediaSearch(args.query),
      get_full_student_data: async () => JSON.stringify(await getFullStudentData(userId))
    };

    const tools = [{
      functionDeclarations: [
        { name: "execute_math", description: "Execute Python for complex math.", parameters: { type: SchemaType.OBJECT, properties: { code: { type: SchemaType.STRING } }, required: ["code"] } },
        { name: "get_grades", description: "Get student grades." },
        { name: "get_financials", description: "Get financial balance." },
        { name: "get_weekly_schedule", description: "Get full schedule." },
        { name: "web_search", description: "Search web.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING } }, required: ["query"] } },
        { name: "web_fetch", description: "Fetch URL content.", parameters: { type: SchemaType.OBJECT, properties: { url: { type: SchemaType.STRING } }, required: ["url"] } },
        { name: "youtube_search", description: "Search YouTube.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING } }, required: ["query"] } },
        { name: "wikipedia_search", description: "Search Wikipedia.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING } }, required: ["query"] } },
        { name: "get_full_student_data", description: "Get all student info." }
      ]
    }];

    // Helper to map messages to Gemini parts with strict turn alternation
    const mapMessagesToContents = (msgs: any[]) => {
      const contents: any[] = [];
      msgs.forEach((m: any) => {
        let role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        if (m.role === 'tool' || m.role === 'function') role = 'function';
        
        const parts: any[] = [];
        let content = m.content || "";

        if (m.role === 'tool' || m.role === 'function') {
          parts.push({ functionResponse: { name: m.name || m.tool_call_id, response: { content: m.content } } });
        } else {
          if (role === 'model' && content) {
            content = content.replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '').trim();
          }
          if (content) parts.push({ text: content });

          if (m.tool_calls) {
            m.tool_calls.forEach((tc: any) => {
              parts.push({ functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) } });
            });
          }
        }

        if (parts.length === 0) return;

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts.push(...parts);
        } else {
          contents.push({ role, parts });
        }
      });
      return contents;
    };

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const userMessage = messages[messages.length - 1].content;
    const contents = mapMessagesToContents(messages.slice(0, -1));
    const lastPart = { text: userMessage };
    
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts.push(lastPart);
    } else {
      contents.push({ role: 'user', parts: [lastPart] });
    }

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    const safeWrite = async (text: string) => {
      try {
        await writer.write(encoder.encode(text));
      } catch (e) {
        // Only log if it's not a closed stream error
        if (!(e instanceof Error && e.message.includes('closed'))) {
          console.warn("[Assistant] Write failed:", e);
        }
      }
    };

    (async () => {
      try {
        let turnCount = 0;
        const maxTurns = 8;

        while (turnCount < maxTurns) {
          turnCount++;
          console.log(`[Assistant] Turn ${turnCount}: Sending ${contents.length} messages to model`);
          
          const responseStream = await model.generateContentStream({
            contents,
            tools: tools as any
          });

          let modelText = "";
          let toolCalls: any[] = [];

          try {
            for await (const chunk of responseStream.stream) {
              const parts = chunk.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  modelText += part.text;
                  await safeWrite(part.text);
                }
                if (part.functionCall) {
                  toolCalls.push(part.functionCall);
                }
              }
            }
          } catch (chunkErr: any) {
            console.error(`[Assistant] Chunk processing error:`, chunkErr);
            // If we already have some text, we might be able to stop gracefully
            if (!modelText && toolCalls.length === 0) throw chunkErr;
            break; 
          }

          const modelTurn: any = { role: 'model', parts: [] };
          if (modelText) modelTurn.parts.push({ text: modelText });
          if (toolCalls.length > 0) {
            toolCalls.forEach(tc => modelTurn.parts.push({ functionCall: tc }));
          }
          
          if (modelTurn.parts.length > 0) {
            contents.push(modelTurn);
          }

          if (toolCalls.length > 0) {
            console.log(`[Assistant] Model requested ${toolCalls.length} tools`);
            const toolResults = await Promise.all(toolCalls.map(async (tc) => {
              const { name, args } = tc;
              await safeWrite(`\nSTATUS:PROCESSING\nTOOL_USED: ${name}\n`);
              try {
                const toolResult = await toolMap[name](args);
                return { functionResponse: { name, response: { content: toolResult } } };
              } catch (toolErr: any) {
                console.error(`[Assistant] Tool ${name} failed:`, toolErr);
                return { functionResponse: { name, response: { content: `Error: ${toolErr.message}` } } };
              }
            }));
            
            contents.push({ role: 'function', parts: toolResults });
            continue; 
          }

          break; 
        }
      } catch (err: any) {
        console.error("[Assistant] Final Stream Error:", err);
        await safeWrite(`\n\n[System Error: ${err.message}]`);
      } finally {
        try {
          await writer.close();
        } catch (e) {}
      }
    })();

    return new Response(transformStream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
