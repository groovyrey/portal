import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await initDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Fetch Student
    const studentDoc = await getDoc(doc(db, 'students', userId));
    if (!studentDoc.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const student = studentDoc.data();

    // Fetch Schedule
    const scheduleDoc = await getDoc(doc(db, 'schedules', userId));
    const schedule = scheduleDoc.exists() ? scheduleDoc.data().items : [];

    // Fetch Financials
    const financialsDoc = await getDoc(doc(db, 'financials', userId));
    let financials = null;
    if (financialsDoc.exists()) {
      const f = financialsDoc.data();
      financials = {
        total: f.total,
        balance: f.balance,
        dueToday: f.due_today,
        ...f.details
      };
    }

    // Fetch Prospectus
    const prospectusSnap = await getDocs(collection(db, 'prospectus_subjects'));
    const offeredSubjects = prospectusSnap.docs.map(d => ({
        code: d.id,
        ...d.data()
    } as any));

    // Reconstruct Student Object
    const studentData = {
      id: userId,
      name: student.name,
      course: student.course,
      gender: student.gender,
      address: student.address,
      contact: student.contact,
      email: student.email,
      yearLevel: student.year_level,
      semester: student.semester,
      schedule: schedule.length > 0 ? schedule : null,
      financials: financials,
      offeredSubjects: offeredSubjects.length > 0 ? offeredSubjects : null,
      availableReports: student.available_reports 
    };

    return NextResponse.json({ success: true, data: studentData });

  } catch (error: any) {
    console.error('Session restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
