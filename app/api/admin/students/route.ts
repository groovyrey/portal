import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getStudentProfile, getAllStudents } from '@/lib/data-service';

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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase();

    const allStudents = await getAllStudents();
    const students = search 
      ? allStudents.filter(s => 
          s.name.toLowerCase().includes(search) || 
          s.id.toLowerCase().includes(search)
        )
      : [];

    return NextResponse.json({ success: true, students });

  } catch (error: any) {
    console.error('Admin students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
