import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { logActivity } from '@/lib/activity-service';

export async function POST(req: NextRequest) {
  try {
    const { settings: newSettings } = await req.json();
    if (!newSettings) return NextResponse.json({ error: 'Settings required' }, { status: 400 });

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
    const studentSnap = await getDoc(studentRef);
    const existingSettings = studentSnap.exists() ? studentSnap.data()?.settings || {} : {};

    // Identify precisely which keys changed
    const changedKeys: string[] = [];
    const keyMap: Record<string, string> = {
      notifications: 'App Alerts',
      classReminders: 'Schedule Reminders',
      paymentReminders: 'Financial Alerts',
      isPublic: 'Public Profile',
      showAcademicInfo: 'Academic Info',
      showStudentId: 'Student ID'
    };

    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== existingSettings[key]) {
        changedKeys.push(keyMap[key] || key);
      }
    });

    await updateDoc(studentRef, { settings: newSettings });

    // Only log if something actually changed
    if (changedKeys.length > 0) {
      logActivity(
        userId, 
        'Settings', 
        { 
          message: 'Updated account settings', 
          changes: changedKeys.join(', '),
          data: newSettings 
        }
      ).catch(e => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
