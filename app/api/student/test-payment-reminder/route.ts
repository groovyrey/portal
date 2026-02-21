import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { sendEmail, getPaymentReminderEmailTemplate } from '@/lib/email-service';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { parseStudentName } from '@/lib/utils';
import { createNotification } from '@/lib/notification-service';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await initDatabase();
    const studentSnap = await getDoc(doc(db, 'students', userId));
    
    if (!studentSnap.exists()) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentData = studentSnap.data();

    // Calculate mock due date (5 days from now in PH Time)
    const now = new Date();
    const phTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const targetDate = new Date(phTime);
    targetDate.setDate(phTime.getDate() + 5);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}/${month}/${day}`;

    // Mock installment for test
    const mockInstallment = {
      description: "🧪 TEST INSTALLMENT",
      dueDate: targetDateStr,
      outstanding: "1,234.56"
    };

    const message = `🧪 Test Reminder: Your ${mockInstallment.description} of ₱${mockInstallment.outstanding} is due in 5 days (${mockInstallment.dueDate}). This is a test to verify your notification settings.`;

    // 1. Create in-app notification
    await createNotification({
      userId,
      title: "Test Payment Reminder 💳",
      message,
      type: 'warning',
      link: '/accounts' 
    });

    // 2. Send Email Alert (if email exists)
    let emailSent = false;
    if (studentData.email) {
      try {
        const parsedName = parseStudentName(studentData.name);
        const firstName = parsedName.firstName || studentData.name;
        const html = getPaymentReminderEmailTemplate(firstName, mockInstallment);

        await sendEmail({
          to: studentData.email,
          subject: `🧪 Test Payment Reminder - ${mockInstallment.description}`,
          text: message,
          html: html
        });
        emailSent = true;
      } catch (e: any) {
        console.error(`Failed to send test email to ${studentData.email}:`, e.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test notification created and ${emailSent ? 'email sent' : 'no email sent (email missing)'}`,
      dueDateIdentifier: targetDateStr
    });

  } catch (error: any) {
    console.error('Test payment reminder error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test reminder' }, { status: 500 });
  }
}
