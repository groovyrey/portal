import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { query, getClient } from './turso';
import { decrypt, encrypt } from './auth';
import { PORTAL_BASE } from './constants';

/**
 * Session Proxy (Turso Implementation)
 * Maintains a persistent, encrypted session for the school portal locally.
 */

export interface SessionResult {
  client: AxiosInstance;
  jar: CookieJar;
  isNew: boolean;
  userId: string;
  isLocked?: boolean;
  consecutiveFailures?: number;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

export async function getSessionClient(userId: string): Promise<SessionResult> {
  // Initialize local jar and client
  const jar = new CookieJar();
  const localClient = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: DEFAULT_HEADERS,
    timeout: 20000 
  }));

  try {
    const res = await query('SELECT * FROM portal_sessions WHERE id = ?', [userId]);

    if (res.rowCount > 0) {
      const data = res.rows[0];
      const lastUpdate = data.updated_at ? new Date(data.updated_at) : new Date(0);
      const lastAttempt = data.last_attempt_at ? new Date(data.last_attempt_at) : new Date(0);
      const consecutiveFailures = data.consecutive_failures || 0;
      
      // Trust the session if it was verified in the last 30 minutes (Local Trust)
      const isRecentlyVerified = (Date.now() - lastUpdate.getTime()) < 30 * 60 * 1000;

      const cooldownMs = Math.min(consecutiveFailures * 2 * 60 * 1000, 30 * 60 * 1000); 
      if (consecutiveFailures >= 3 && (Date.now() - lastAttempt.getTime()) < cooldownMs) {
          return { client: localClient, jar, isNew: false, userId, isLocked: true, consecutiveFailures };
      }

      const lockUntil = data.refresh_lock_until ? new Date(data.refresh_lock_until) : new Date(0);
      if (Date.now() < lockUntil.getTime()) {
          return { client: localClient, jar, isNew: false, userId, isLocked: true };
      }

      if (data.encrypted_jar) {
        try {
          const decrypted = decrypt(data.encrypted_jar);
          const jarData = JSON.parse(decrypted);
          const newJar = CookieJar.fromJSON(jarData);
          
          const hydratedLocalClient = wrapper(axios.create({ 
            jar: newJar, 
            withCredentials: true,
            headers: DEFAULT_HEADERS,
            timeout: 20000
          }));

          // Local re-verification
          if (isRecentlyVerified) {
              return { client: hydratedLocalClient, jar: newJar, isNew: false, userId };
          }

          const testRes = await hydratedLocalClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`);
          if (!testRes.data.includes('obtnLogin') && !testRes.data.includes('otbUserID')) {
            if (consecutiveFailures > 0) {
                await query('UPDATE portal_sessions SET consecutive_failures = 0 WHERE id = ?', [userId]);
            }
            return { client: hydratedLocalClient, jar: newJar, isNew: false, userId };
          }
        } catch (e) {
          console.warn('Failed to rehydrate session, starting fresh:', e);
        }
      }
    }
  } catch (error) {
    console.error('Session retrieval error:', error);
  }

  // IMPORTANT: For NEW sessions (Login), ALWAYS use local client
  return { client: localClient, jar, isNew: true, userId };
}

export async function saveSession(userId: string, jar: CookieJar, isSuccess: boolean = true) {
  try {
    const now = new Date().toISOString();
    
    if (!isSuccess) {
        const res = await query('SELECT consecutive_failures FROM portal_sessions WHERE id = ?', [userId]);
        const currentFailures = res.rowCount > 0 ? (res.rows[0].consecutive_failures || 0) : 0;
        
        await query(`
          INSERT INTO portal_sessions (id, consecutive_failures, last_attempt_at, refresh_lock_until) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            consecutive_failures = ?, 
            last_attempt_at = ?, 
            refresh_lock_until = ?
        `, [
          userId, currentFailures + 1, now, new Date(0).toISOString(),
          currentFailures + 1, now, new Date(0).toISOString()
        ]);
        return;
    }

    const jarJson = JSON.stringify(jar.toJSON());
    const encrypted = encrypt(jarJson);
    
    await query(`
      INSERT INTO portal_sessions (id, encrypted_jar, updated_at, last_attempt_at, consecutive_failures, refresh_lock_until)
      VALUES (?, ?, ?, ?, 0, ?)
      ON CONFLICT(id) DO UPDATE SET
        encrypted_jar = ?,
        updated_at = ?,
        last_attempt_at = ?,
        consecutive_failures = 0,
        refresh_lock_until = ?
    `, [
      userId, encrypted, now, now, new Date(0).toISOString(),
      encrypted, now, now, new Date(0).toISOString()
    ]);

  } catch (error) {
    console.error('Failed to save portal session:', error);
  }
}

export async function acquireRefreshLock(userId: string): Promise<boolean> {
    const dbClient = await getClient();
    try {
        const now = Date.now();
        const res = await dbClient.query('SELECT refresh_lock_until FROM portal_sessions WHERE id = ?', [userId]);
        
        if (res.rowCount > 0) {
            const data = res.rows[0];
            const lockUntil = data.refresh_lock_until ? new Date(data.refresh_lock_until) : new Date(0);
            if (now < lockUntil.getTime()) {
                dbClient.release();
                return false;
            }
        }

        const lockDuration = 60 * 1000;
        const newLockUntil = new Date(now + lockDuration).toISOString();
        const nowIso = new Date().toISOString();

        await dbClient.query(`
          INSERT INTO portal_sessions (id, refresh_lock_until, last_attempt_at)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            refresh_lock_until = ?,
            last_attempt_at = ?
        `, [userId, newLockUntil, nowIso, newLockUntil, nowIso]);
        
        await dbClient.commit();
        return true;
    } catch (e) {
        console.error('Failed to acquire lock:', e);
        await dbClient.rollback();
        return false;
    } finally {
        dbClient.release();
    }
}
