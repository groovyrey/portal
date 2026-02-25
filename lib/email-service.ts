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
export function getScheduleEmailTemplate(name: string, classes: any[], baseUrl: string) {
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
          <a href="${baseUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Open LCC Hub</a>
        </div>
      </div>
      <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 11px; color: #a0aec0; line-height: 1.6;">
        You're receiving this because Daily Class Reminders are enabled on your account.<br>
        <strong>Tip:</strong> You can turn these off anytime in <strong>Settings > Notifications</strong>.<br>
        <br>
        &copy; ${new Date().getFullYear()} LCC Hub System Reference.
      </div>
    </div>
  `;
}

/**
 * Generates a clean HTML template for payment reminders.
 */
export function getPaymentReminderEmailTemplate(name: string, installment: any, baseUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #dc2626; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Payment Reminder</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Hello, ${name}!</p>
      </div>
      <div style="padding: 24px; text-align: center;">
        <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
          This is a friendly reminder that your <strong>${installment.description}</strong> 
          is due in <strong>5 days</strong> (${installment.dueDate}).
        </p>
        
        <div style="margin: 32px 0; padding: 20px; background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px;">
          <div style="font-size: 14px; color: #c53030; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Outstanding Balance</div>
          <div style="font-size: 32px; font-weight: 800; color: #9b2c2c; margin-top: 4px;">₱${installment.outstanding}</div>
        </div>

        <p style="font-size: 14px; color: #718096; margin-bottom: 32px;">
          To avoid any late fees or registration holds, please ensure your payment is processed by the due date.
        </p>

        <div style="margin-top: 32px;">
          <a href="${baseUrl}/accounts" style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">View Billing Details</a>
        </div>
      </div>
      <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 11px; color: #a0aec0; line-height: 1.6;">
        You're receiving this because Payment Notifications are enabled on your account.<br>
        <strong>Note:</strong> If you've already made a payment, please allow 1-2 business days for the system to reflect the update.<br>
        <br>
        &copy; ${new Date().getFullYear()} LCC Hub System Reference.
      </div>
    </div>
  `;
}
