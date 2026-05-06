import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
    await initDatabase();
    const student = await getStudentProfile(userId);
    if (!student) {
      console.error(`[Assistant] Profile not found for ${userId}`);
      return new Response('Profile not found', { status: 404 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");
    const modelId = "gemma-4-26b-a4b-it";
    console.log(`[Assistant] Initializing model: ${modelId}`);

    const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: `You are the "LCCian Companion" for ${SCHOOL_INFO.name}. 
Address user as ${student.name.split(' ')[0]}. 
Be concise and helpful. Avoid repeating yourself.
Use Markdown Tables for structured data.
Base answers ONLY on tool data or provided context.
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
        { name: "execute_math", description: "Execute Python for complex math.", parameters: { type: "OBJECT", properties: { code: { type: "string" } }, required: ["code"] } },
        { name: "get_grades", description: "Get student grades." },
        { name: "get_financials", description: "Get financial balance." },
        { name: "get_weekly_schedule", description: "Get full schedule." },
        { name: "web_search", description: "Search web.", parameters: { type: "OBJECT", properties: { query: { type: "string" } }, required: ["query"] } },
        { name: "web_fetch", description: "Fetch URL content.", parameters: { type: "OBJECT", properties: { url: { type: "string" } }, required: ["url"] } },
        { name: "youtube_search", description: "Search YouTube.", parameters: { type: "OBJECT", properties: { query: { type: "string" } }, required: ["query"] } },
        { name: "wikipedia_search", description: "Search Wikipedia.", parameters: { type: "OBJECT", properties: { query: { type: "string" } }, required: ["query"] } },
        { name: "get_full_student_data", description: "Get all student info." }
      ]
    }];

    // Helper to map messages to Gemini parts with strict turn alternation
    const mapMessagesToContents = (msgs: any[]) => {
      const contents: any[] = [];
      msgs.forEach((m: any) => {
        let role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
        const parts: any[] = [];
        
        if (m.tool_calls) {
          role = 'model';
          m.tool_calls.forEach((tc: any) => {
            parts.push({ functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) } });
          });
        } else if (m.role === 'tool' || m.role === 'function') {
          role = 'function';
          parts.push({ functionResponse: { name: m.name || m.tool_call_id, response: { content: m.content } } });
        } else {
          parts.push({ text: m.content || " " });
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

    const contents = mapMessagesToContents(messages.slice(0, -1));
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    (async () => {
      try {
        let turnCount = 0;
        const maxTurns = 8;

        while (turnCount < maxTurns) {
          turnCount++;
          console.log(`[Assistant] Turn ${turnCount}: Sending ${contents.length} messages to model`);
          
          const responseStream = await model.generateContentStream({
            contents,
            tools
          });

          let modelText = "";
          let toolCalls: any[] = [];

          try {
            for await (const chunk of responseStream.stream) {
              const parts = chunk.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  modelText += part.text;
                  await writer.write(encoder.encode(part.text));
                }
                if (part.functionCall) {
                  toolCalls.push(part.functionCall);
                }
              }
            }
          } catch (chunkErr: any) {
            console.error(`[Assistant] Chunk processing error:`, chunkErr);
            throw chunkErr;
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
              await writer.write(encoder.encode(`\nSTATUS:PROCESSING\nTOOL_USED: ${name}\n`));
              const toolResult = await toolMap[name](args);
              return { functionResponse: { name, response: { content: toolResult } } };
            }));
            
            contents.push({ role: 'function', parts: toolResults });
            continue; 
          }

          break; 
        }
      } catch (err: any) {
        console.error("[Assistant] Stream Error:", err);
        await writer.write(encoder.encode(`\n\n[System Error: ${err.message}]`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(transformStream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
