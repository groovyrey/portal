import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

    // Fetch Student
    const students = await sql`SELECT * FROM students WHERE id = ${userId}`;
    if (students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const student = students[0];

    // Fetch Schedule
    const schedule = await sql`SELECT subject, section, units, time, room FROM schedules WHERE student_id = ${userId}`;

    // Fetch Financials
    const financialsRes = await sql`SELECT total, balance, due_today, details FROM financials WHERE student_id = ${userId}`;
    let financials = null;
    if (financialsRes.length > 0) {
      const f = financialsRes[0];
      financials = {
        total: f.total,
        balance: f.balance,
        dueToday: f.due_today,
        ...f.details // details is stored as JSONB
      };
    }

    // Fetch Prospectus (All subjects for now, or filter if we had a student_prospectus link)
    // The scraping logic puts *all* subjects into prospectus_subjects.
    // The current frontend structure expects `offeredSubjects` on the student object.
    // Let's fetch all offered subjects as that's what the scraping did.
    const offeredSubjectsRes = await sql`SELECT code, description, units, pre_req FROM prospectus_subjects`;
    const offeredSubjects = offeredSubjectsRes.map(s => ({
        code: s.code,
        description: s.description,
        units: s.units,
        preReq: s.pre_req
    }));

    // Reconstruct Student Object
    const studentData = {
      id: student.id,
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
