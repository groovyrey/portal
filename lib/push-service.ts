import { query } from './turso';

let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_PROJECT_ID || 'lccportal';
    if (!clientEmail || !privateKey) return null;
    const auth = new GoogleAuth({
      credentials: { type: 'service_account', client_email: clientEmail, private_key: privateKey, project_id: projectId },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (token.token) cachedToken = { token: token.token, expires: Date.now() + 1800000 };
    return token.token || null;
  } catch (e) {
    console.error('[Push] Auth error:', e);
    return null;
  }
}

export async function sendPushToUser(userId: string, title: string, body: string): Promise<number> {
  const tokenRes = await query('SELECT token FROM device_tokens WHERE user_id = $1', [userId]);
  if (tokenRes.rows.length === 0) return 0;

  const accessToken = await getAccessToken();
  if (!accessToken) return 0;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'lccportal';
  let sent = 0;
  for (const row of tokenRes.rows) {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: { token: row.token, notification: { title, body } },
        }),
      });
      if (res.ok) sent++;
      else console.error(`[Push] FCM send failed:`, await res.text());
    } catch (e) {
      console.error(`[Push] FCM error:`, e);
    }
  }
  return sent;
}
