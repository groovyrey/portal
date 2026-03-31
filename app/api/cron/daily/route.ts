import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { getStudentSchedule } from '@/lib/data-service';
import { createNotification } from '@/lib/notification-service';
import { sendEmail, getScheduleEmailTemplate, getPaymentReminderEmailTemplate } from '@/lib/email-service';
import { parseStudentName } from '@/lib/utils';

/**
 * Daily Consolidated Cron Job
 * Handles all daily tasks and specific weekly tasks based on a map.
 */

// Note: Helper to parse time string for sorting
function parseTimeValue(timeStr: string): number {
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!match) return 9999; 
    let [_, hoursStr, minsStr, meridiem] = match;
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    meridiem = meridiem.toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    else if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  } catch (e) { return 9999; }
}

async function runScheduleReminders(phTime: Date, baseUrl: string) {
  const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayCode = dayMap[phTime.getDay()];
  const studentsSnap = await getDocs(collection(db, 'students'));
  let count = 0;
  let emailCount = 0;

  for (const studentDoc of studentsSnap.docs) {
    try {
      const userId = studentDoc.id;
      const studentData = studentDoc.data();
      if (studentData.settings?.classReminders === false) continue;

      const schedule = await getStudentSchedule(userId);
      if (!schedule) continue;

      const todaysClasses = schedule.filter(item => {
        if (!item.time) return false;
        const dayPart = item.time.toUpperCase().split(/\d/)[0].trim();
        if (dayPart.includes(todayCode)) {
           if (todayCode === 'TUE' && dayPart.includes('THU')) return dayPart.includes('TUE');
           return true;
        }
        return false;
      });

      if (todaysClasses.length > 0) {
        const sorted = todaysClasses.sort((a, b) => parseTimeValue(a.time) - parseTimeValue(b.time));
        const first = sorted[0];
        const message = todaysClasses.length === 1 
          ? `You have one class today: ${first.description} at ${first.time.split(' ').slice(1).join(' ')}.`
          : `You have ${todaysClasses.length} classes today starting with ${first.description} at ${first.time.split(' ').slice(1).join(' ')}.`;

        await createNotification({ userId, title: "Today's Schedule 📚", message, type: 'info', link: '/grades' });
        count++;

        let recipientEmail = studentData.email || (userId.includes('@') ? userId : null);
        if (recipientEmail && studentData.settings?.notifications !== false) {
          try {
            const firstName = parseStudentName(studentData.name).firstName || studentData.name;
            const html = getScheduleEmailTemplate(firstName, sorted, baseUrl);
            await sendEmail({ to: recipientEmail, subject: `📅 Class Schedule - ${phTime.toLocaleDateString()}`, text: message, html });
            emailCount++;
          } catch (e) {}
        }
      }
    } catch (err) {}
  }
  return { notified: count, emailed: emailCount };
}

async function runPaymentReminders(phTime: Date, baseUrl: string) {
  const targetDate = new Date(phTime);
  targetDate.setDate(phTime.getDate() + 5);
  const targetDateStr = `${targetDate.getFullYear()}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(targetDate.getDate()).padStart(2, '0')}`;
  
  const studentsSnap = await getDocs(collection(db, 'students'));
  let count = 0;
  let emailCount = 0;

  for (const studentDoc of studentsSnap.docs) {
    try {
      const userId = studentDoc.id;
      const studentData = studentDoc.data();
      if (studentData.settings?.paymentReminders === false) continue;

      const financialSnap = await getDoc(doc(db, 'financials', userId));
      if (!financialSnap.exists()) continue;

      const installments = financialSnap.data().details?.installments || [];
      const due = installments.find((inst: any) => {
        const instDate = inst.dueDate?.replace(/-/g, '/').trim();
        return instDate === targetDateStr && inst.outstanding && inst.outstanding !== "0.00";
      });

      if (due) {
        const message = `Friendly reminder: Your ${due.description} of ₱${due.outstanding} is due in 5 days (${due.dueDate}).`;
        await createNotification({ userId, title: "Payment Reminder 💳", message, type: 'warning', link: '/accounts' });
        count++;

        if (studentData.email && studentData.settings?.notifications !== false) {
          try {
            const firstName = parseStudentName(studentData.name).firstName || studentData.name;
            const html = getPaymentReminderEmailTemplate(firstName, due, baseUrl);
            await sendEmail({ to: studentData.email, subject: `💳 Payment Reminder - ${due.description}`, text: message, html });
            emailCount++;
          } catch (e) {}
        }
      }
    } catch (err) {}
  }
  return { notified: count, emailed: emailCount };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const phTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const dayIndex = phTime.getDay(); // Note: 0=SUN, 1=MON, etc.
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://lcchub.vercel.app' : `http://${req.headers.get('host')}`;
    
    // Note: --- Weekly Task Map ---
    // Note: Tasks that run every single day
    const dailyTasks = ['scheduleReminders', 'paymentReminders'];
    
    // Note: Tasks that run only on specific days
    const weeklyTaskMap: Record<number, string[]> = {
      0: [], // Note: Sunday
      1: ['weeklySummary'], // Note: Monday
      3: ['midWeekCheck'],  // Note: Wednesday
      5: ['weekendPreview'] // Note: Friday
    };

    const activeTasks = [...dailyTasks, ...(weeklyTaskMap[dayIndex] || [])];
    const results: any = { tasks: activeTasks, data: {} };

    if (activeTasks.includes('scheduleReminders')) {
      results.data.schedule = await runScheduleReminders(phTime, baseUrl);
    }
    if (activeTasks.includes('paymentReminders')) {
      results.data.payments = await runPaymentReminders(phTime, baseUrl);
    }

    // Note: Log the consolidated run with unique ID for history
    const runRef = collection(db, 'cron_runs');
    await addDoc(runRef, {
      jobId: 'daily-consolidated',
      status: 'success',
      lastRun: new Date().toISOString(),
      tasks: activeTasks,
      results: results.data
    });

    // Reminder: Cleanup: Keep only last 20 records total for this jobId
    const q = query(
      collection(db, 'cron_runs'), 
      where('jobId', '==', 'daily-consolidated'),
      orderBy('lastRun', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.size > 20) {
      const batch = writeBatch(db);
      snap.docs.slice(20).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
