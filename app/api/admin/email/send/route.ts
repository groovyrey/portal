import { NextRequest, NextResponse } from 'next/server';
import { decrypt, isStaff } from '@/lib/auth';
import { getAllStudents, getStudentProfile } from '@/lib/data-service';
import { sendEmail } from '@/lib/email-service';

export const maxDuration = 300; // Allow up to 5 minutes for mass mailing

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let adminUserId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      adminUserId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Verify staff permission
    if (!(await isStaff(adminUserId))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { targets, subject, body } = await req.json();

    if (!subject || !body || !targets || (Array.isArray(targets) && targets.length === 0)) {
      return NextResponse.json({ error: 'Missing required fields: targets, subject, and body' }, { status: 400 });
    }

    let recipients: { email: string, name: string }[] = [];

    if (targets === 'all') {
      const allStudents = await getAllStudents();
      recipients = allStudents
        .filter(s => s.email && s.email.includes('@'))
        .map(s => ({ email: s.email!, name: s.name }));
    } else if (targets && typeof targets === 'object' && !Array.isArray(targets)) {
      // targeting by criteria (e.g. badges)
      if (targets.badges && Array.isArray(targets.badges) && targets.badges.length > 0) {
        const allStudents = await getAllStudents();
        recipients = allStudents
          .filter(s => {
            if (!s.email || !s.email.includes('@')) return false;
            if (!s.badges || s.badges.length === 0) return false;
            // Intersection: has at least one of the targeted badges
            return targets.badges.some((bId: string) => s.badges?.includes(bId));
          })
          .map(s => ({ email: s.email!, name: s.name }));
      }
    } else if (Array.isArray(targets)) {
      // targets is an array of student IDs
      for (const id of targets) {
        const profile = await getStudentProfile(id);
        if (profile && profile.email && profile.email.includes('@')) {
          recipients.push({ email: profile.email, name: profile.name });
        }
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Send emails sequentially or in small chunks to avoid rate limits
    // Sequential for simplicity and reliability in this environment
    for (const recipient of recipients) {
      try {
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">Announcement</h1>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Hello, ${recipient.name}!</p>
            </div>
            <div style="padding: 24px; color: #1a202c; line-height: 1.6;">
              <h2 style="margin-top: 0; color: #2d3748;">${subject}</h2>
              <div style="white-space: pre-wrap;">${body}</div>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #edf2f7;">
              Sent via LCCian Hub Official Portal Admin System.<br>
              &copy; ${new Date().getFullYear()} La Concepcion College Student Portal.
            </div>
          </div>
        `;

        await sendEmail({
          to: recipient.email,
          subject,
          text: `${subject}\n\n${body}`,
          html
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send email to ${recipient.email}:`, err);
        failureCount++;
        errors.push(`${recipient.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      results: {
        total: recipients.length,
        success: successCount,
        failure: failureCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Admin send email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
