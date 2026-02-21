import nodemailer from 'nodemailer';

/**
 * Email Service
 * Uses Nodemailer to send transactional emails via SMTP.
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email service is not configured. Skipping email to:', to);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"LCC Hub Alerts" <noreply@portal.lcc.edu.ph>',
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Generates a clean HTML template for schedule notifications.
 */
export function getScheduleEmailTemplate(name: string, classes: any[]) {
  const classRows = classes.map(c => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7;">
        <div style="font-weight: bold; color: #1a202c;">${c.description}</div>
        <div style="font-size: 12px; color: #718096;">${c.subject}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; color: #4a5568;">
        ${c.time}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #edf2f7; text-align: right; color: #4a5568;">
        ${c.room}
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Today's Class Schedule</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Good morning, ${name}!</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              <th style="padding: 12px; border-bottom: 2px solid #edf2f7;">Subject</th>
              <th style="padding: 12px; border-bottom: 2px solid #edf2f7; text-align: right;">Time</th>
              <th style="padding: 12px; border-bottom: 2px solid #edf2f7; text-align: right;">Room</th>
            </tr>
          </thead>
          <tbody>
            ${classRows}
          </tbody>
        </table>
        <div style="margin-top: 32px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Open LCC Hub</a>
        </div>
      </div>
      <div style="background-color: #f7fafc; padding: 16px; text-align: center; font-size: 11px; color: #a0aec0;">
        You're receiving this because you enabled notifications on LCC Hub.<br>
        &copy; ${new Date().getFullYear()} LCC Hub System Reference.
      </div>
    </div>
  `;
}
