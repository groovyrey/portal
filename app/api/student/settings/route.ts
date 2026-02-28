import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, updateDoc } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { logActivity } from '@/lib/activity-service';

export async function POST(req: NextRequest) {
  try {
    const { settings } = await req.json();
    if (!settings) return NextResponse.json({ error: 'Settings required' }, { status: 400 });

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
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    const studentRef = doc(db, 'students', userId);
    await updateDoc(studentRef, { settings });

    // Log settings update
    logActivity(userId, 'Settings', 'Updated account settings').catch(e => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
