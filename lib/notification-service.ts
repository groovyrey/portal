import { query } from './pg';
import { publishUpdate } from './realtime';
import { messaging } from './firebase-admin';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

/**
 * Creates a notification in the database and optionally publishes a real-time update and web push (FCM).
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

      // Send a web push via FCM if tokens exist
      await sendFCMNotifications(userId, { title, message, link });
    }

    return res.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Helper to send FCM notifications to a user
 */
async function sendFCMNotifications(userId: string, payload: { title: string, message: string, link?: string }) {
  try {
    // Get all FCM tokens for this user
    // We reuse the subscription JSONB to store { token: '...' } or just the token string
    const res = await query(`
      SELECT subscription FROM push_subscriptions WHERE user_id = $1
    `, [userId]);

    const tokens = res.rows.map(row => {
      const sub = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription;
      return sub.token || sub; // Support both { token: '...' } and raw string
    }).filter(t => typeof t === 'string');

    if (tokens.length === 0) return;

    const messages = tokens.map(token => ({
      token,
      notification: {
        title: payload.title,
        body: payload.message,
      },
      data: {
        link: payload.link || '/',
      },
      webpush: {
        fcmOptions: {
          link: payload.link || '/',
        }
      }
    }));

    // Send messages in batches (FCM limit is 500 per call, but we'll send individually or use sendEach)
    const response = await messaging.sendEach(messages);
    
    // Cleanup invalid tokens
    const tokensToRemove: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (errorCode === 'messaging/registration-token-not-registered' || 
            errorCode === 'messaging/invalid-registration-token') {
          tokensToRemove.push(tokens[idx]);
        }
        console.error('FCM individual error:', resp.error);
      }
    });

    if (tokensToRemove.length > 0) {
      for (const token of tokensToRemove) {
        await query(`
          DELETE FROM push_subscriptions 
          WHERE user_id = $1 AND (subscription->>'token' = $2 OR subscription::text = $3)
        `, [userId, token, JSON.stringify(token)]);
      }
    }
  } catch (error) {
    console.error('Error sending FCM notifications:', error);
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

    // Handle mass FCM push
    const tokensRes = await query(`
      SELECT user_id, subscription FROM push_subscriptions WHERE user_id != $1
    `, [excludeUserId]);

    const allTokensData = tokensRes.rows.map(row => ({
      userId: row.user_id,
      token: (typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription).token || row.subscription
    })).filter(t => typeof t.token === 'string');

    if (allTokensData.length === 0) return;

    // Batching to avoid limits (max 500 per sendEach)
    const batchSize = 500;
    for (let i = 0; i < allTokensData.length; i += batchSize) {
      const batch = allTokensData.slice(i, i + batchSize);
      const messages = batch.map(data => ({
        token: data.token,
        notification: {
          title,
          body: message,
        },
        data: {
          link: link || '/',
        },
        webpush: {
          fcmOptions: {
            link: link || '/',
          }
        }
      }));

      const response = await messaging.sendEach(messages);
      
      // Cleanup invalid tokens in the background
      const tokensToRemove: {userId: string, token: string}[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/registration-token-not-registered' || 
              errorCode === 'messaging/invalid-registration-token') {
            tokensToRemove.push(batch[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        for (const item of tokensToRemove) {
          query(`
            DELETE FROM push_subscriptions 
            WHERE user_id = $1 AND (subscription->>'token' = $2 OR subscription::text = $3)
          `, [item.userId, item.token, JSON.stringify(item.token)]).catch(e => console.error('Token cleanup error:', e));
        }
      }
    }
  } catch (error) {
    console.error('Error notifying all students via FCM:', error);
  }
}
