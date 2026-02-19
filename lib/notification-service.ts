import { query } from './pg';
import { publishUpdate } from './realtime';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

/**
 * Creates a notification in the database and optionally publishes a real-time update.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  link
}: CreateNotificationParams) {
  try {
    const res = await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [userId, title, message, type, link]);

    // Notify the user via Ably if they are online
    await publishUpdate(`notifications:${userId}`, {
      type: 'NOTIFICATION_RECEIVED',
      notification: {
        id: res.rows[0].id.toString(),
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
        createdAt: res.rows[0].created_at.toISOString()
      }
    });

    return res.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Notifies all students except the sender.
 */
export async function notifyAllStudents({
  excludeUserId,
  title,
  message,
  type = 'info',
  link
}: Omit<CreateNotificationParams, 'userId'> & { excludeUserId: string }) {
  try {
    // Get all student IDs except the sender
    const studentsRes = await query('SELECT id FROM students WHERE id != $1', [excludeUserId]);
    
    // Create notifications for each student
    const promises = studentsRes.rows.map(student => 
      createNotification({
        userId: student.id,
        title,
        message,
        type,
        link
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying all students:', error);
  }
}
