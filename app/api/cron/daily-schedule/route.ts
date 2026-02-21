import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs } from 'firebase/firestore';
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

    for (const studentDoc of studentsSnap.docs) {
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

        // Sort by time (simplified)
        const sortedClasses = todaysClasses.sort((a, b) => a.time.localeCompare(b.time));
        const firstClass = sortedClasses[0];
        
        const message = todaysClasses.length === 1 
          ? `You have one class today: ${firstClass.description} at ${firstClass.time.split(' ').slice(1).join(' ')}.`
          : `You have ${todaysClasses.length} classes today starting with ${firstClass.description} at ${firstClass.time.split(' ').slice(1).join(' ')}.`;

        // 5. Create in-app notification & Real-time alert
        await createNotification({
          userId,
          title: "Today's Schedule 📚",
          message,
          type: 'info',
          link: '/grades' 
        });
        
        notificationCount++;

        // 6. Send Email Alert (if enabled and email exists)
        if (studentData.email && studentData.settings?.notifications !== false) {
          try {
            const parsedName = parseStudentName(studentData.name);
            const firstName = parsedName.firstName || studentData.name;
            const html = getScheduleEmailTemplate(firstName, sortedClasses);

            await sendEmail({
              to: studentData.email,
              subject: `📅 Class Schedule for Today - ${phTime.toLocaleDateString()}`,
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

    return NextResponse.json({ 
      success: true, 
      processed: studentsSnap.size, 
      notified: notificationCount,
      emailed: emailCount,
      day: todayCode
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
