import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export const maxDuration = 30;

// Initialize OpenAI client with xAI configuration
const xaiClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

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
You are "Portal AI", a professional Student Assistant for La Concepcion College (LCC).
Today is ${new Date().toLocaleDateString()}.

STUDENT: ${student.name} (${student.course}, Year ${student.year_level})
SCHEDULE: ${scheduleItems.map((s: any) => {
  const fullSubject = offeredSubjects.find((o: any) => o.code === s.subject);
  const title = fullSubject ? `${s.subject} - ${fullSubject.description}` : s.subject;
  return `${title}: ${s.time} (${s.room})`;
}).join(', ') || 'None'}
FINANCIALS: ${financials ? `Balance: ₱${financials.balance}, Total: ₱${financials.total}, Due: ₱${financials.due_today}` : 'No data'}
GRADES: ${allGrades.map(g => `${g.description}: ${g.grade} (${g.remarks})`).slice(0, 10).join(', ')}...
OFFERED: ${offeredSubjects.map((s: any) => `${s.code}: ${s.description}`).slice(0, 10).join(', ')}...

INSTRUCTIONS:
- Be concise.
- Answer only using provided student data.
`.trim();

    // 3. Inference Call with actual xAI API via OpenAI SDK
    const response = await xaiClient.chat.completions.create({
      model: 'grok-3',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      stream: true,
    });

    // 4. Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
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
    console.error('Chat API Error:', error);
    return new Response('Failed to process request: ' + error.message, { status: 500 });
  }
}
