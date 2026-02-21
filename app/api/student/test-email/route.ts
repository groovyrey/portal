import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { sendEmail, getScheduleEmailTemplate } from '@/lib/email-service';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { parseStudentName } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    const studentSnap = await getDoc(doc(db, 'students', userId));
    
    if (!studentSnap.exists()) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentData = studentSnap.data();
    if (!studentData.email) {
      return NextResponse.json({ error: 'No email address found in your profile' }, { status: 400 });
    }

    // Generate a mock schedule for testing
    const mockClasses = [
      {
        description: "TEST SUBJECT 101",
        subject: "Introduction to LCC Hub",
        time: "MON 8:00AM-10:00AM",
        room: "VIRTUAL ROOM 1",
        section: "TEST-SEC"
      },
      {
        description: "MODERN SYSTEMS 202",
        subject: "Advanced Portal Integration",
        time: "FRI 1:00PM-3:00PM",
        room: "FCM2-308",
        section: "SYS-ARC"
      }
    ];

    const parsedName = parseStudentName(studentData.name);
    const firstName = parsedName.firstName || studentData.name;
    const html = getScheduleEmailTemplate(firstName, mockClasses);

    await sendEmail({
      to: studentData.email,
      subject: "🧪 Test Notification - LCC Hub",
      text: "This is a test notification from LCC Hub. Your email service is working correctly!",
      html: html
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${studentData.email}` });

  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
  }
}
