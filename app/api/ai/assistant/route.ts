import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '@/lib/db';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export const maxDuration = 30;

// Google Generative AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { messages, timezone = 'Asia/Manila' } = await req.json();
    
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
    } catch (e) {
      return new Response('Invalid or expired session', { status: 401 });
    }

    await initDatabase();

    if (!db) {
      return new Response('Database connection failed', { status: 500 });
    }

    // 2. Gather Initial Context (User-specific)
    const studentDoc = await getDoc(doc(db, 'students', userId));
    if (!studentDoc.exists()) {
      return new Response('Student profile not found.', { status: 404 });
    }
    const student = studentDoc.data();

    const [scheduleSnap, financialsSnap, gradesSnap, prospectusSnap] = await Promise.all([
      getDoc(doc(db, 'schedules', userId)),
      getDoc(doc(db, 'financials', userId)),
      getDocs(query(collection(db, 'grades'), where('student_id', '==', userId))),
      getDocs(collection(db, 'prospectus_subjects'))
    ]);

    const prospectus: Record<string, string> = {};
    prospectusSnap.forEach(doc => {
      prospectus[doc.id] = doc.data().description;
    });

    const scheduleItems = scheduleSnap.exists() ? scheduleSnap.data().items || [] : [];
    const financials = financialsSnap.exists() ? financialsSnap.data() : null;
    let financialContext = 'No financial data found.';
    if (financials) {
      financialContext = `
- Current Balance: ${financials.balance || '0.00'}
- Total Assessment: ${financials.total || '0.00'}
- Due Today: ${financials.due_today || '0.00'}
`.trim();

      if (financials.details) {
        const details = financials.details;
        if (details.installments?.length > 0) {
          financialContext += '\n\nINSTALLMENTS/ASSESSMENT:\n' + details.installments.map((i: any) => `- ${i.description} (${i.dueDate}): Assessed: ${i.assessed} | Outstanding: ${i.outstanding}`).join('\n');
        }
        if (details.payments?.length > 0) {
          financialContext += '\n\nRECENT PAYMENTS:\n' + details.payments.map((p: any) => `- ${p.date}: ${p.amount} (Ref: ${p.reference})`).join('\n');
        }
        if (details.adjustments?.length > 0) {
          financialContext += '\n\nADJUSTMENTS:\n' + details.adjustments.map((a: any) => `- ${a.description} (${a.dueDate}): ${a.adjustment} | Outstanding: ${a.outstanding}`).join('\n');
        }
        if (details.dueAccounts?.length > 0) {
          financialContext += '\n\nSTATEMENT OF ACCOUNT (DUE):\n' + details.dueAccounts.map((d: any) => `- ${d.description} (${d.dueDate}): Due: ${d.due} | Paid: ${d.paid}`).join('\n');
        }
      }
    }
    
    // Process all grades for better context
    const allGrades: any[] = [];
    gradesSnap.forEach(doc => {
      const data = doc.data();
      if (data.items) {
        data.items.forEach((item: any) => {
          const code = item.code || 'N/A';
          const title = item.description || prospectus[code] || item.subject || 'Unknown Subject';
          allGrades.push({ 
            report: data.report_name, 
            code: code, 
            description: title, 
            grade: item.grade || 'N/A', 
            remarks: item.remarks || 'N/A'
          });
        });
      }
    });

    // Calculate basic stats for the AI
    const numericGrades = allGrades
      .map(g => parseFloat(g.grade))
      .filter(g => !isNaN(g));
    const gpa = numericGrades.length > 0 
      ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(2) 
      : 'N/A';

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
You are "Portal Assistant", a friendly and helpful academic advisor for La Concepcion College (LCC).

CURRENT CONTEXT:
- Date: ${dateStr}
- Time: ${timeStr}

STUDENT PROFILE:
- Name: ${student.name}
- Course: ${student.course}
- Year Level: ${student.year_level}
- Semester: ${student.semester || 'N/A'}
- Student ID: ${userId}

ACADEMIC QUICK STATS:
- Calculated Avg Grade (Numeric only): ${gpa}
- Total Subjects Recorded: ${allGrades.length}

CURRENT SCHEDULE:
${scheduleItems.length > 0 ? scheduleItems.map((s: any) => {
  const code = s.code || s.subject || 'N/A';
  const title = s.description || prospectus[code] || s.subject || 'Unknown Subject';
  return `- ${title} (${code}): ${s.time} | Room: ${s.room}`;
}).join('\n') : 'No schedule data found.'}

FINANCIAL STATUS:
${financialContext}

GRADE SUMMARY (MOST RECENT):
${allGrades.slice(0, 20).map(g => `- [${g.report}] ${g.description}: ${g.grade} (${g.remarks})`).join('\n')}
${allGrades.length > 20 ? '...and more subjects in the record.' : ''}

INSTRUCTIONS:
- Use the student's data to provide highly personalized assistance.
- If the student asks about their grades, analyze the record provided above.
- If they ask about fees, reference the financial status.
- If they ask about their classes, look at the current schedule.
- Be encouraging, professional, and empathetic.
- Keep responses concise but thorough.
- Reference the current time and date if relevant.
`.trim();

    // 3. Inference Call with Gemini
    const modelName = "gemma-3-27b-it"; 
    const model = genAI.getGenerativeModel({ 
      model: modelName,
    });

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready to assist the student based on their profile and academic data." }] },
        ...messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessageStream(lastMessage);
    
    // We create a TransformStream to handle the streaming response back to the client
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Background process to stream text
    (async () => {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            await writer.write(encoder.encode(text));
          }
        }
      } catch (err: any) {
        console.error("Streaming error:", err);
        await writer.write(encoder.encode("\n\n[Error during processing: " + err.message + "]"));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
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
