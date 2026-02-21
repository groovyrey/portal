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

    // 3. Fetch real financial data for this student
    const financialSnap = await getDoc(doc(db, 'financials', userId));
    let targetInstallment = null;

    if (financialSnap.exists()) {
      const financialData = financialSnap.data();
      const installments = financialData.details?.installments || [];
      
      // Find the first installment that is NOT paid (outstanding > 0)
      // and optionally in the future (though for a test, any unpaid one is good)
      targetInstallment = installments.find((inst: any) => {
        const outstanding = parseFloat(inst.outstanding?.replace(/,/g, '') || "0");
        return outstanding > 0;
      });
    }

    // 4. Mock installment if no real unpaid installment is found
    const displayInstallment = targetInstallment ? {
      description: targetInstallment.description,
      dueDate: targetInstallment.dueDate,
      outstanding: targetInstallment.outstanding
    } : {
      description: "🧪 MOCK INSTALLMENT (No unpaid found)",
      dueDate: "2026/12/25",
      outstanding: "1,234.56"
    };

    const message = `🧪 Test Reminder: Your ${displayInstallment.description} of ₱${displayInstallment.outstanding} is due on ${displayInstallment.dueDate}. This test identified your next pending payment.`;

    // 5. Create in-app notification
    await createNotification({
      userId,
      title: "Test Payment Reminder 💳",
      message,
      type: 'warning',
      link: '/accounts' 
    });

    // 6. Send Email Alert (if email exists)
    let emailSent = false;
    if (studentData.email) {
      try {
        const parsedName = parseStudentName(studentData.name);
        const firstName = parsedName.firstName || studentData.name;
        const html = getPaymentReminderEmailTemplate(firstName, displayInstallment);

        await sendEmail({
          to: studentData.email,
          subject: `🧪 Test Payment Reminder - ${displayInstallment.description}`,
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
      message: targetInstallment 
        ? `Test sent using your next installment: ${targetInstallment.description}` 
        : `Test sent using mock data (all your installments are paid!)`,
      installment: displayInstallment
    });

  } catch (error: any) {
    console.error('Test payment reminder error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send test reminder' }, { status: 500 });
  }
}
