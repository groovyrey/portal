import { query } from './pg';
import { publishUpdate } from './realtime';
import webpush from 'web-push';

// Configuration for web-push (VAPID keys)
// These should be in environment variables
const vapidDetails = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
};

if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

/**
 * Creates a notification in the database and optionally publishes a real-time update and web push.
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

      // Send a web push if subscriptions exist
      await sendWebPush(userId, { title, message, link });
    }

    return res.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Helper to send web push notifications to a user
 */
async function sendWebPush(userId: string, payload: { title: string, message: string, link?: string }) {
  if (!vapidDetails.publicKey || !vapidDetails.privateKey) {
    return; // VAPID keys not configured
  }

  try {
    // Get all subscriptions for this user
    const res = await query(`
      SELECT subscription FROM push_subscriptions WHERE user_id = $1
    `, [userId]);

    const subscriptions = res.rows;

    const pushPromises = subscriptions.map(sub => {
      return webpush.sendNotification(
        sub.subscription,
        JSON.stringify(payload)
      ).catch(err => {
        // If the subscription has expired or is invalid, remove it from the DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          return query(`
            DELETE FROM push_subscriptions 
            WHERE user_id = $1 AND subscription->>'endpoint' = $2
          `, [userId, sub.subscription.endpoint]);
        }
        console.error('Web push error:', err);
      });
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('Error sending web push:', error);
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
    // This is significantly more efficient than individual inserts at scale
    await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      SELECT id, $1, $2, $3, $4
      FROM students
      WHERE id != $5
    `, [title, message, type, link, excludeUserId]);
    
    // Broadcast a general update to all students to check their notifications
    // Instead of 1,000+ individual messages, we send one broadcast message
    await publishUpdate('community', {
      type: 'GLOBAL_NOTIFICATION_RELOAD',
      title
    });

    // Handle mass push (this could be optimized)
    const subscriptionsRes = await query(`
      SELECT user_id, subscription FROM push_subscriptions WHERE user_id != $1
    `, [excludeUserId]);

    const pushPromises = subscriptionsRes.rows.map(sub => {
      return webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, message, link })
      ).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          return query(`
            DELETE FROM push_subscriptions 
            WHERE user_id = $1 AND subscription->>'endpoint' = $2
          `, [sub.user_id, sub.subscription.endpoint]);
        }
        console.error('Mass web push error:', err);
      });
    });

    await Promise.all(pushPromises);
  } catch (error) {
    console.error('Error notifying all students:', error);
  }
}
