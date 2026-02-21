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
  link,
  skipRealtime = false
}: CreateNotificationParams & { skipRealtime?: boolean }) {
  try {
    const res = await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [userId, title, message, type, link]);

    if (!skipRealtime) {
      // Notify the user via Ably if they are online
      await publishUpdate(`student-${userId}`, {
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
    }

    return res.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Notifies all students except the sender using a single bulk database operation.
 */
export async function notifyAllStudents({
  excludeUserId,
  title,
  message,
  type = 'info',
  link
}: Omit<CreateNotificationParams, 'userId'> & { excludeUserId: string }) {
  try {
    // Bulk insert into notifications for all students except the sender
    await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      SELECT id, $1, $2, $3, $4
      FROM students
      WHERE id != $5
    `, [title, message, type, link, excludeUserId]);
    
    // Broadcast a general update to all students to check their notifications
    await publishUpdate('community', {
      type: 'GLOBAL_NOTIFICATION_RELOAD',
      title
    });
  } catch (error) {
    console.error('Error notifying all students:', error);
  }
}
