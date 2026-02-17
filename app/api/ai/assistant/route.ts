import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '@/lib/db';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
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

    // 2. Gather Context
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

    const scheduleItems = scheduleSnap.exists() ? scheduleSnap.data().items || [] : [];
    const financials = financialsSnap.exists() ? financialsSnap.data() : null;
    const allGrades: any[] = [];
    gradesSnap.forEach(doc => {
      const data = doc.data();
      if (data.items) {
        data.items.forEach((item: any) => {
          allGrades.push({ report_name: data.report_name, ...item });
        });
      }
    });
    const offeredSubjects = prospectusSnap.docs.map(d => ({ code: d.id, ...d.data() })) as any[];

    const systemPrompt = `
You are "Portal Assistant", a friendly and helpful academic advisor for La Concepcion College (LCC).
Today is ${new Date().toLocaleDateString()}.

STUDENT INFO:
Name: ${student.name}
Course: ${student.course}
Year: ${student.year_level}

ACADEMIC CONTEXT:
SCHEDULE: ${scheduleItems.map((s: any) => {
  const fullSubject = offeredSubjects.find((o: any) => o.code === s.subject);
  const title = fullSubject ? `${s.subject} - ${fullSubject.description}` : s.subject;
  return `${title}: ${s.time} (${s.room})`;
}).join(', ') || 'None'}
FINANCIALS: ${financials ? `Balance: ₱${financials.balance}, Total: ₱${financials.total}, Due: ₱${financials.due_today}` : 'No data'}
GRADES: ${allGrades.map(g => `${g.description}: ${g.grade} (${g.remarks})`).slice(0, 10).join(', ')}...

INSTRUCTIONS:
- Use the student's data to provide personalized assistance.
- Be encouraging and professional.
- If they ask about something not in their data, politely say you don't have access to that information yet.
- Keep responses concise but thorough.
`.trim();

    // 3. Inference Call with Gemini
    const modelName = "gemini-3-flash-preview";
    const model = genAI.getGenerativeModel({ model: modelName });

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

    // 4. Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return new Response('Failed to process request: ' + error.message, { status: 500 });
  }
}
