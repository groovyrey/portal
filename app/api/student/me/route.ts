import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { getFullStudentData } from '@/lib/data-service';

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
      if (!userId) throw new Error("No UserID in session data");
    } catch (e: any) {
      console.error('Session decryption failed:', e.message);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await initDatabase();

    if (!db) {
      console.error('Database not initialized in /api/student/me');
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Use Centralized Data Service
    try {
        const studentData = await getFullStudentData(userId);
        
        if (!studentData) {
          console.warn(`Student document for ${userId} not found via Data Service`);
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: studentData });

    } catch (fetchError: any) {
        console.error('Data Service fetch error in /api/student/me:', fetchError.message);
        return NextResponse.json({ error: 'Failed to retrieve student data' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Session restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
