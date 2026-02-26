import { NextRequest } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { db } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { getFullStudentData } from '@/lib/data-service';
import { Financials, ScheduleItem } from '@/types';
import { 
  SCHOOL_INFO, 
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES, 
  IMPORTANT_OFFICES 
} from '@/lib/assistant-knowledge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, timezone = 'Asia/Manila' }: { messages: Message[], timezone?: string } = await req.json();
    
    // 1. Authenticate
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

    // 2. Gather Initial Context via Centralized Service
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
`.trim();

      if (financials.dueAccounts && financials.dueAccounts.length > 0) {
        financialContext += '\n\nPENDING DUES (Payable ASAP):\n' + financials.dueAccounts.map((d: Required<Financials>['dueAccounts'][number]) => `- Due Date: ${d.dueDate} | ${d.description} | Due: ${d.due}`).join('\n');
      }

      if (financials.installments && financials.installments.length > 0) {
        financialContext += '\n\nINSTALLMENT PLAN:\n' + financials.installments.map((i: Required<Financials>['installments'][number]) => `- ${i.description} (${i.dueDate}): Assessed: ${i.assessed} | Outstanding: ${i.outstanding}`).join('\n');
      }

      if (financials.payments && financials.payments.length > 0) {
        financialContext += '\n\nPAYMENT HISTORY:\n' + financials.payments.map((p: Required<Financials>['payments'][number]) => `- ${p.date}: ${p.amount} (Ref: ${p.reference})`).join('\n');
      }

      if (financials.adjustments && financials.adjustments.length > 0) {
        financialContext += '\n\nADJUSTMENTS:\n' + financials.adjustments.map((a: Required<Financials>['adjustments'][number]) => `- ${a.dueDate}: ${a.description} | ${a.adjustment}`).join('\n');
      }
    }

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
You are "Portal Assistant", a friendly and helpful academic advisor for ${SCHOOL_INFO.name} (${SCHOOL_INFO.acronym}).
Your goal is to assist students with their academic journey, financial inquiries, and general campus life questions.

CURRENT CONTEXT:
- Date: ${dateStr}
- Time: ${timeStr}

STUDENT PROFILE:
- Name: ${studentData.name}
- Course: ${studentData.course}
- Year Level: ${studentData.yearLevel}
- Semester: ${studentData.semester || 'N/A'}
- Student ID: ${userId}

ACADEMIC QUICK STATS:
- Calculated Avg Grade (Numeric only): ${gpa}
- Total Subjects Recorded: ${allGrades.length}

CURRENT SCHEDULE:
${scheduleItems.length > 0 ? scheduleItems.map((s: ScheduleItem) => {
  const code = s.subject; // Handle variations
  const title = s.description || s.subject || 'Unknown Subject';
  return `- ${title} (${code}): ${s.time} | Room: ${s.room}`;
}).join('\n') : 'No schedule data found.'}

FINANCIAL STATUS:
${financialContext}

GRADE SUMMARY (MOST RECENT):
${allGrades.slice(0, 20).map((g: any) => `- [${g.code}] ${g.description}: ${g.grade} (${g.remarks})`).join('\n')}
${allGrades.length > 20 ? '...and more subjects in the record.' : ''}

---
SCHOOL KNOWLEDGE BASE:

1. GENERAL INFO:
   - Location: ${SCHOOL_INFO.location}
   - Core Values: ${SCHOOL_INFO.coreValues.join(', ')}
   - Motto: "${SCHOOL_INFO.motto}"

2. GRADING REFERENCE:
${GRADING_SYSTEM}

3. COMMON BUILDINGS:
${Object.entries(BUILDING_CODES).map(([code, name]) => `   - ${code}: ${name}`).join('\n')}

4. IMPORTANT OFFICES:
${IMPORTANT_OFFICES.map(o => `   - ${o.name}: ${o.purpose}`).join('\n')}

5. PROCEDURES:
${COMMON_PROCEDURES}
---

INSTRUCTIONS:
- Use the student's data AND the school knowledge base to provide highly personalized assistance.
- If the student asks about their grades, analyze their record but also explain what the grade means (e.g., "1.25 is Excellent!").
- If they ask about fees, reference the financial status and explain installment deadlines if applicable.
- If they ask "Where is my class?", check the schedule and use the building codes to explain the location (e.g., "FCM2-311 is in the Annex Building").
- If they ask about dropping subjects or incomplete grades, guide them with the procedural steps provided.
- Be encouraging, professional, and empathetic. Use the school's values (Leadership, Competence, Character) in your tone where appropriate.
- Keep responses concise but thorough.
- Reference the current time and date if relevant.
`.trim();

    // 3. Initialize LangChain Model
    const model = new ChatGoogleGenerativeAI({
      model: "gemma-3-27b-it",
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      maxOutputTokens: 2048,
      streaming: true,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      new HumanMessage(systemPrompt),
      new AIMessage("Understood. I am ready to assist the student based on their profile and academic data."),
      new MessagesPlaceholder("history"),
      ["user", "{input}"],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Prepare history
    const history = messages.slice(0, -1).map((m: Message) => {
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });

    const lastMessage = messages[messages.length - 1].content;
    
    // 4. Stream Response
    const stream = await chain.stream({
      history: history,
      input: lastMessage,
    });

    // Create a new stream for the Response object
    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();

    (async () => {
      try {
        for await (const chunk of stream) {
          await writer.write(encoder.encode(chunk));
        }
      } catch (err: any) {
        console.error("Streaming error:", err);
        await writer.write(encoder.encode("\n\n[Error during processing: " + err.message + "]"));
      } finally {
        await writer.close();
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
