import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getStudentSchedule } from '@/lib/data-service';
import { createNotification } from '@/lib/notification-service';
import { sendEmail, getScheduleEmailTemplate } from '@/lib/email-service';
import { parseStudentName } from '@/lib/utils';

/**
 * Daily Schedule Notification Cron Job
 * Runs every morning to notify students of their classes for the day.
 */

export async function GET(req: NextRequest) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Map current day to Portal day abbreviations (3 letters)
    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    // Use Philippines time (UTC+8)
    const phTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const todayIndex = phTime.getDay();
    const todayCode = dayMap[todayIndex];

    console.log(`Running daily schedule check for day code: ${todayCode} (Local PH Time: ${phTime.toString()})`);

    // 3. Fetch all students from Firestore
    const studentsSnap = await getDocs(collection(db, 'students'));
    let notificationCount = 0;
    let emailCount = 0;
    let failureCount = 0;

    for (const studentDoc of studentsSnap.docs) {
      try {
        const userId = studentDoc.id;
        const studentData = studentDoc.data();
        const schedule = await getStudentSchedule(userId);

        if (!schedule || schedule.length === 0) continue;

        // 4. Filter classes that contain today's code
        // Example schedule.time: "SAT 10:00AM-12:00PM" or "TUE-THU 1:00PM-3:00PM"
        const todaysClasses = schedule.filter(item => {
          if (!item.time) return false;
          const timeStr = item.time.toUpperCase();
          
          // Extract the day part (everything before the first digit)
          const dayPart = timeStr.split(/\d/)[0].trim();
          
          // Check if todayCode is present as a distinct day in the dayPart
          // We use a regex to ensure we match the full abbreviation (e.g., TUE not matching THU)
          const dayRegex = new RegExp(`\\b${todayCode}\\b|${todayCode}(?=[^A-Z]|$)`, 'i');
          
          // Special case: some portal formats might not use spaces/delimiters like "TUE-THU"
          // or "MWF" (though your example shows 3-letter abbreviations)
          if (dayPart.includes(todayCode)) {
             // If today is TUE, make sure we aren't just matching the 'T' in 'THU'
             if (todayCode === 'TUE' && dayPart.includes('THU')) {
                // Only match TUE if it appears elsewhere or is explicitly TUE
                return dayPart.includes('TUE');
             }
             return true;
          }
          
          return false;
        });

        if (todaysClasses.length > 0) {
          // --- Respect User Settings ---
          const isEnabled = studentData.settings?.classReminders !== false;
          if (!isEnabled) continue;

          // Sort by time
          const sortedClasses = todaysClasses.sort((a, b) => {
            return parseTimeValue(a.time) - parseTimeValue(b.time);
          });
          const firstClass = sortedClasses[0];
          
          const message = todaysClasses.length === 1 
            ? `You have one class today: ${firstClass.description} at ${firstClass.time.split(' ').slice(1).join(' ')}. You can manage these reminders in Settings.`
            : `You have ${todaysClasses.length} classes today starting with ${firstClass.description} at ${firstClass.time.split(' ').slice(1).join(' ')}. Manage reminders in Settings.`;

          // 5. Create in-app notification & Real-time alert
          await createNotification({
            userId,
            title: "Today's Schedule 📚",
            message,
            type: 'info',
            link: '/grades' 
          });
          
          notificationCount++;

          // 6. Send Email Alert (if enabled and email exists or userId is an email)
          // Some students use email as their username (userId)
          let recipientEmail = studentData.email;
          if (!recipientEmail && userId.includes('@') && userId.includes('.')) {
            recipientEmail = userId;
          }

          if (recipientEmail && studentData.settings?.notifications !== false) {
            try {
              const parsedName = parseStudentName(studentData.name);
              const firstName = parsedName.firstName || studentData.name;
              const html = getScheduleEmailTemplate(firstName, sortedClasses);

              await sendEmail({
                to: recipientEmail,
                subject: `📅 Class Schedule for Today - ${phTime.toLocaleDateString()}`,
                text: message,
                html: html
              });
              emailCount++;
            } catch (e: any) {
              console.error(`Failed to send email to ${recipientEmail}:`, e.message);
            }
          }
        }
      } catch (err) {
        console.error(`Failed to process daily schedule for student ${studentDoc.id}:`, err);
        failureCount++;
      }
    }

    // 7. Log the run in Firestore
    const dateStr = phTime.toISOString().split('T')[0]; // YYYY-MM-DD
    await setDoc(doc(db, 'cron_runs', `daily-schedule_${dateStr}`), {
      jobId: 'daily-schedule',
      status: 'success',
      lastRun: new Date().toISOString(),
      processed: studentsSnap.size,
      notified: notificationCount,
      emailed: emailCount,
      failures: failureCount,
      day: todayCode
    });

    return NextResponse.json({ 
      success: true, 
      processed: studentsSnap.size, 
      notified: notificationCount,
      emailed: emailCount,
      failures: failureCount,
      day: todayCode
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseTimeValue(timeStr: string): number {
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!match) return 9999; 

    let [_, hoursStr, minsStr, meridiem] = match;
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    
    meridiem = meridiem.toUpperCase();
    
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + mins;
  } catch (e) {
    return 9999;
  }
}
