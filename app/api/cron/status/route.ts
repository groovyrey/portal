import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const now = new Date();
    const phTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const dateStr = phTime.toISOString().split('T')[0];

    const dailyScheduleRef = doc(db, 'cron_runs', `daily-schedule_${dateStr}`);
    const paymentReminderRef = doc(db, 'cron_runs', `payment-reminder_${dateStr}`);

    const [dailySnap, paymentSnap] = await Promise.all([
      getDoc(dailyScheduleRef),
      getDoc(paymentReminderRef)
    ]);

    return NextResponse.json({
      date: dateStr,
      jobs: {
        dailySchedule: dailySnap.exists() ? dailySnap.data() : { status: 'pending' },
        paymentReminder: paymentSnap.exists() ? paymentSnap.data() : { status: 'pending' }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
