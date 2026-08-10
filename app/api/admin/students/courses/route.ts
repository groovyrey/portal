import { NextRequest, NextResponse } from 'next/server';
import { decrypt, isStaff } from '@/lib/auth';
import { getAllStudents } from '@/lib/data-service';

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

    if (!(await isStaff(userId))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allStudents = await getAllStudents();
    const courses = [...new Set(allStudents.map(s => s.course).filter((c): c is string => !!c))].sort();

    return NextResponse.json({ success: true, courses });

  } catch (error: any) {
    console.error('Admin courses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
