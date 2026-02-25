import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, updateDoc } from 'firebase/firestore';
import { decrypt } from '@/lib/auth';
import { getStudentProfile } from '@/lib/data-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { badges } = await req.json();
    if (!Array.isArray(badges)) {
      return NextResponse.json({ error: 'Badges must be an array.' }, { status: 400 });
    }

    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, {
      badges: badges
    });

    return NextResponse.json({ success: true, message: 'Badges updated successfully' });

  } catch (error: any) {
    console.error('Admin update badges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
