import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { createNotification } from '@/lib/notification-service';
import { sendEmail, getPaymentReminderEmailTemplate } from '@/lib/email-service';
import { parseStudentName } from '@/lib/utils';

/**
 * Payment Reminder Cron Job
 * Checks for students with installments due in 5 days.
 * Replaces the old Portal Health check.
 */

export async function GET(req: NextRequest) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Calculate target date (5 days from now in PH Time)
    const now = new Date();
    const phTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const targetDate = new Date(phTime);
    targetDate.setDate(phTime.getDate() + 5);

    // Format: YYYY/MM/DD (matches portal format)
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${year}/${month}/${day}`;

    console.log(`Running payment reminder check for: ${targetDateStr} (Today: ${phTime.toLocaleDateString()})`);

    // 3. Fetch all students from Firestore
    const studentsSnap = await getDocs(collection(db, 'students'));
    let notificationCount = 0;
    let emailCount = 0;

    for (const studentDoc of studentsSnap.docs) {
      const userId = studentDoc.id;
      const studentData = studentDoc.data();

      // 4. Fetch financial data for this student
      const financialSnap = await getDoc(doc(db, 'financials', userId));
      if (!financialSnap.exists()) continue;

      const financialData = financialSnap.data();
      const installments = financialData.details?.installments || [];

      // 5. Check for due installments
      const dueInstallment = installments.find((inst: any) => {
        // Normalize date (some might have different separators or spaces)
        const instDate = inst.dueDate?.replace(/-/g, '/').trim();
        const isOutstanding = inst.outstanding && inst.outstanding !== "0.00" && inst.outstanding !== "0";
        
        return instDate === targetDateStr && isOutstanding;
      });

      if (dueInstallment) {
        // --- Respect User Settings ---
        const isEnabled = studentData.settings?.paymentReminders !== false;
        if (!isEnabled) continue;

        const message = `Friendly reminder: Your ${dueInstallment.description} of ₱${dueInstallment.outstanding} is due in 5 days (${dueInstallment.dueDate}).`;

        // 6. Create in-app notification & Real-time alert
        await createNotification({
          userId,
          title: "Payment Reminder 💳",
          message,
          type: 'warning',
          link: '/accounts' 
        });
        
        notificationCount++;

        // 7. Send Email Alert (if enabled and email exists)
        if (studentData.email && studentData.settings?.notifications !== false) {
          try {
            const parsedName = parseStudentName(studentData.name);
            const firstName = parsedName.firstName || studentData.name;
            const html = getPaymentReminderEmailTemplate(firstName, dueInstallment);

            await sendEmail({
              to: studentData.email,
              subject: `💳 Payment Reminder - ${dueInstallment.description}`,
              text: message,
              html: html
            });
            emailCount++;
          } catch (e: any) {
            console.error(`Failed to send email to ${studentData.email}:`, e.message);
          }
        }
      }
    }

    // 8. Log the run in Firestore
    const runDateStr = phTime.toISOString().split('T')[0]; // YYYY-MM-DD
    await setDoc(doc(db, 'cron_runs', `payment-reminder_${runDateStr}`), {
      jobId: 'payment-reminder',
      status: 'success',
      lastRun: new Date().toISOString(),
      processed: studentsSnap.size,
      notified: notificationCount,
      emailed: emailCount,
      targetDate: targetDateStr
    });

    return NextResponse.json({ 
      success: true, 
      processed: studentsSnap.size, 
      notified: notificationCount,
      emailed: emailCount,
      targetDate: targetDateStr
    });

  } catch (error: any) {
    console.error('Payment Reminder Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
