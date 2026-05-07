import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { getStudentSchedule } from '@/lib/data-service';
import { createNotification } from '@/lib/notification-service';
import { sendEmail, getScheduleEmailTemplate, getPaymentReminderEmailTemplate } from '@/lib/email-service';
import { parseStudentName } from '@/lib/utils';
import { logAdminAction } from '@/lib/admin-logs';

/**
 * Daily Consolidated Cron Job (Turso Implementation)
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
  
  const res = await query('SELECT * FROM students');
  let count = 0;
  let emailCount = 0;

  for (const studentData of res.rows) {
    try {
      const userId = studentData.id;
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

        const recipientEmail = studentData.email || (userId.includes('@') ? userId : null);
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
  
  const res = await query('SELECT * FROM students');
  let count = 0;
  let emailCount = 0;

  for (const studentData of res.rows) {
    try {
      const userId = studentData.id;
      if (studentData.settings?.paymentReminders === false) continue;

      const finRes = await query('SELECT details FROM financials WHERE student_id = ?', [userId]);
      if (finRes.rowCount === 0) continue;

      const installments = finRes.rows[0].details?.installments || [];
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
    const dayIndex = phTime.getDay(); 
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://lcchub.vercel.app' : `http://${req.headers.get('host')}`;
    
    const dailyTasks = ['scheduleReminders', 'paymentReminders'];
    
    const weeklyTaskMap: Record<number, string[]> = {
      0: [], 
      1: ['weeklySummary'], 
      3: ['midWeekCheck'],  
      5: ['weekendPreview'] 
    };

    const activeTasks = [...dailyTasks, ...(weeklyTaskMap[dayIndex] || [])];
    const results: any = { tasks: activeTasks, data: {} };

    if (activeTasks.includes('scheduleReminders')) {
      results.data.schedule = await runScheduleReminders(phTime, baseUrl);
      await logAdminAction({
        adminId: 'system-cron',
        adminName: 'Daily Task',
        targetId: 'notifications',
        targetName: 'Schedule Reminders',
        action: 'CRON_SCHEDULE_DISPATCHED',
        details: `Dispatched ${results.data.schedule.notified} push notifications and ${results.data.schedule.emailed} emails for today's classes.`
      });
    }
    if (activeTasks.includes('paymentReminders')) {
      results.data.payments = await runPaymentReminders(phTime, baseUrl);
      await logAdminAction({
        adminId: 'system-cron',
        adminName: 'Daily Task',
        targetId: 'notifications',
        targetName: 'Payment Reminders',
        action: 'CRON_PAYMENTS_DISPATCHED',
        details: `Dispatched ${results.data.payments.notified} push notifications and ${results.data.payments.emailed} emails for upcoming payment deadlines.`
      });
    }

    // Note: Log the consolidated run
    await query(`
      INSERT INTO cron_runs (job_id, status, last_run, tasks, results)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'daily-consolidated', 
      'success', 
      new Date().toISOString(), 
      JSON.stringify(activeTasks), 
      JSON.stringify(results.data)
    ]);

    // Keep only last 15 records
    await query(`
      DELETE FROM cron_runs 
      WHERE job_id = 'daily-consolidated' 
      AND id NOT IN (
        SELECT id FROM cron_runs 
        WHERE job_id = 'daily-consolidated' 
        ORDER BY last_run DESC 
        LIMIT 15
      )
    `);

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Daily cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
