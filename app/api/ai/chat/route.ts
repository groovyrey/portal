import { NextRequest, NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';
import { db } from '@/lib/db';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Fetch HF Token and set AI Model
    const hfToken = process.env.HUGGINGFACE_API_KEY;
    const aiModel = "moonshotai/Kimi-K2.5";

    if (!hfToken) {
      return NextResponse.json({ error: 'Hugging Face token is not set.' }, { status: 500 });
    }

    const hf = new InferenceClient(hfToken);

    // 1. Authenticate
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    await initDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 2. Gather Context
    const studentDoc = await getDoc(doc(db, 'students', userId));
    if (!studentDoc.exists()) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
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
    const offeredSubjects = prospectusSnap.docs.map(d => ({ code: d.id, ...d.data() }));

    const systemPrompt = `
You are "Portal AI", a professional Student Assistant for La Concepcion College (LCC).
Today is ${new Date().toLocaleDateString()}.

STUDENT: ${student.name} (${student.course}, Year ${student.year_level})
SCHEDULE: ${scheduleItems.map((s: any) => `${s.subject}: ${s.time} (${s.room})`).join(', ') || 'None'}
FINANCIALS: ${financials ? `Balance: ₱${financials.balance}, Total: ₱${financials.total}, Due: ₱${financials.due_today}` : 'No data'}
GRADES: ${allGrades.map(g => `${g.description}: ${g.grade} (${g.remarks})`).slice(0, 10).join(', ')}...
OFFERED: ${offeredSubjects.map((s: any) => `${s.code}: ${s.description}`).slice(0, 10).join(', ')}...

INSTRUCTIONS:
- Be concise.
- Answer only using provided student data.
`.trim();

    // 3. Prepare Messages (Standardizing for AI)
    const messagesForAI = messages.map(({ role, content }: { role: string; content: string }) => ({
      role: role === 'model' ? 'assistant' : role,
      content
    }));

    // 4. Inference Call
    const response = await hf.chatCompletion({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messagesForAI
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return NextResponse.json({ 
      content: response.choices[0].message.content 
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process request: ' + error.message }, { status: 500 });
  }
}
