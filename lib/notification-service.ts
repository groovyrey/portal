import { query } from './turso';
import { publishUpdate } from './realtime';
import { initDatabase } from './db-init';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

const MAX_NOTIFICATIONS = 25;

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
    await initDatabase();
    
    const res = await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [userId, title, message, type, link]);
// ... (rest of the file)

    // Enforce notification limit for the specific user
    await query(`
      DELETE FROM notifications 
      WHERE user_id = $1 
        AND id NOT IN (
          SELECT id FROM notifications 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        )
    `, [userId, MAX_NOTIFICATIONS]);

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
