import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { db } from './db';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { encrypt, decrypt } from './auth';
import { PORTAL_BASE } from './constants';

const RENDER_PROXY_URL = process.env.RENDER_PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

/**
 * Ghost Session Proxy
 * Maintains a persistent, encrypted session for the school portal.
 * Reduces scraping time by bypassing the login handshake if the session is still alive.
 */

export interface SessionResult {
  client: AxiosInstance;
  jar: CookieJar;
  isNew: boolean;
  userId: string;
  isLocked?: boolean;
  consecutiveFailures?: number;
  isProxy?: boolean;
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

/**
 * Syncs the session with the Render proxy server if configured.
 */
async function syncWithRemoteProxy(userId: string, jar: CookieJar) {
    if (!RENDER_PROXY_URL || !PROXY_SECRET) return false;

    try {
        await axios.post(`${RENDER_PROXY_URL}/session/${userId}`, {
            jarData: jar.toJSON()
        }, {
            headers: { 'x-proxy-secret': PROXY_SECRET },
            timeout: 5000
        });
        return true;
    } catch (e: any) {
        console.warn(`[ProxySync] Failed to sync session for ${userId}:`, e.message);
        return false;
    }
}

export async function getSessionClient(userId: string): Promise<SessionResult> {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: DEFAULT_HEADERS,
    timeout: 20000 
  }));

  try {
    const sessionRef = doc(db, 'portal_sessions', userId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      
      const lastAttempt = data.last_attempt_at?.toDate ? data.last_attempt_at.toDate() : new Date(0);
      const consecutiveFailures = data.consecutive_failures || 0;
      
      const cooldownMs = Math.min(consecutiveFailures * 2 * 60 * 1000, 30 * 60 * 1000); 
      if (consecutiveFailures >= 3 && (Date.now() - lastAttempt.getTime()) < cooldownMs) {
          return { client, jar, isNew: false, userId, isLocked: true, consecutiveFailures };
      }

      const lockUntil = data.refresh_lock_until?.toDate ? data.refresh_lock_until.toDate() : new Date(0);
      if (Date.now() < lockUntil.getTime()) {
          return { client, jar, isNew: false, userId, isLocked: true };
      }

      if (data.encryptedJar) {
        try {
          const decrypted = decrypt(data.encryptedJar);
          const jarData = JSON.parse(decrypted);
          const newJar = CookieJar.fromJSON(jarData);
          
          // Try to use the Proxy Server if available
          if (RENDER_PROXY_URL && PROXY_SECRET) {
              const synced = await syncWithRemoteProxy(userId, newJar);
              if (synced) {
                  // Create a client that routes through the proxy
                  const proxyClient = axios.create({
                      baseURL: `${RENDER_PROXY_URL}/proxy/${userId}`,
                      headers: { 'x-proxy-secret': PROXY_SECRET },
                      timeout: 25000
                  });

                  // We need to wrap it to handle the "path" query param automatically
                  // but for now, let's just use it as is and the scraper will need to adjust
                  // Or we can use an interceptor:
                  proxyClient.interceptors.request.use((config) => {
                      if (config.url && config.url.startsWith(PORTAL_BASE)) {
                          const path = config.url.replace(PORTAL_BASE, '');
                          config.url = '';
                          config.params = { ...config.params, path };
                      }
                      return config;
                  });

                  return { client: proxyClient as any, jar: newJar, isNew: false, userId, isProxy: true };
              }
          }

          const hydratedClient = wrapper(axios.create({ 
            jar: newJar, 
            withCredentials: true,
            headers: DEFAULT_HEADERS,
            timeout: 20000
          }));

          const testRes = await hydratedClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`);
          
          if (!testRes.data.includes('obtnLogin') && !testRes.data.includes('otbUserID')) {
            if (consecutiveFailures > 0) {
                await setDoc(sessionRef, { consecutive_failures: 0 }, { merge: true });
            }
            return { client: hydratedClient, jar: newJar, isNew: false, userId };
          }
        } catch (e) {
          console.warn('Failed to rehydrate session, starting fresh:', e);
        }
      }
    }
  } catch (error) {
    console.error('Session Proxy retrieval error:', error);
  }

  return { client, jar, isNew: true, userId };
}

export async function saveSession(userId: string, jar: CookieJar, isSuccess: boolean = true) {
  try {
    const sessionRef = doc(db, 'portal_sessions', userId);
    
    if (!isSuccess) {
        const snap = await getDoc(sessionRef);
        const currentFailures = snap.exists() ? (snap.data().consecutive_failures || 0) : 0;
        await setDoc(sessionRef, {
            consecutive_failures: currentFailures + 1,
            last_attempt_at: serverTimestamp(),
            refresh_lock_until: new Date(0)
        }, { merge: true });
        return;
    }

    const jarJson = JSON.stringify(jar.toJSON());
    const encrypted = encrypt(jarJson);
    
    await setDoc(sessionRef, {
      encryptedJar: encrypted,
      updated_at: serverTimestamp(),
      last_attempt_at: serverTimestamp(),
      consecutive_failures: 0,
      refresh_lock_until: new Date(0)
    }, { merge: true });

    // Also update the remote proxy
    await syncWithRemoteProxy(userId, jar);
  } catch (error) {
    console.error('Failed to save portal session:', error);
  }
}


/**
 * Acquires a lock to prevent multiple simultaneous login attempts.
 * Returns true if lock was acquired, false otherwise.
 */
export async function acquireRefreshLock(userId: string): Promise<boolean> {
    try {
        const sessionRef = doc(db, 'portal_sessions', userId);
        const lockDuration = 60 * 1000; // 60 seconds lock

        return await runTransaction(db, async (transaction) => {
            const sessionSnap = await transaction.get(sessionRef);
            const now = Date.now();
            
            if (sessionSnap.exists()) {
                const data = sessionSnap.data();
                const lockUntil = data.refresh_lock_until?.toDate ? data.refresh_lock_until.toDate() : new Date(0);
                
                if (now < lockUntil.getTime()) {
                    console.log(`Lock already held for ${userId}`);
                    return false;
                }
            }

            const newLockUntil = new Date(now + lockDuration);
            transaction.set(sessionRef, {
                refresh_lock_until: newLockUntil,
                last_attempt_at: serverTimestamp()
            }, { merge: true });
            
            return true;
        });
    } catch (e) {
        console.error('Failed to acquire lock:', e);
        return false;
    }
}
