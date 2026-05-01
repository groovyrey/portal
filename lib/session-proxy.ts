import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { db } from './db';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { encrypt, decrypt } from './auth';
import { PORTAL_BASE } from './constants';

const RENDER_PROXY_URL = process.env.RENDER_PROXY_URL;
const PROXY_SECRET = process.env.PROXY_SECRET;

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
  // Initialize local jar and client as the ultimate fallback
  const jar = new CookieJar();
  const localClient = wrapper(axios.create({ 
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
      const lastUpdate = data.updated_at?.toDate ? data.updated_at.toDate() : new Date(0);
      const lastAttempt = data.last_attempt_at?.toDate ? data.last_attempt_at.toDate() : new Date(0);
      const consecutiveFailures = data.consecutive_failures || 0;
      
      // OPTIMIZATION: Trust the session if it was verified in the last 10 minutes
      const isRecentlyVerified = (Date.now() - lastUpdate.getTime()) < 10 * 60 * 1000;

      const cooldownMs = Math.min(consecutiveFailures * 2 * 60 * 1000, 30 * 60 * 1000); 
      if (consecutiveFailures >= 3 && (Date.now() - lastAttempt.getTime()) < cooldownMs) {
          return { client: localClient, jar, isNew: false, userId, isLocked: true, consecutiveFailures };
      }

      const lockUntil = data.refresh_lock_until?.toDate ? data.refresh_lock_until.toDate() : new Date(0);
      if (Date.now() < lockUntil.getTime()) {
          return { client: localClient, jar, isNew: false, userId, isLocked: true };
      }

      if (data.encryptedJar) {
        try {
          const decrypted = decrypt(data.encryptedJar);
          const jarData = JSON.parse(decrypted);
          const newJar = CookieJar.fromJSON(jarData);
          
          const hydratedLocalClient = wrapper(axios.create({ 
            jar: newJar, 
            withCredentials: true,
            headers: DEFAULT_HEADERS,
            timeout: 18000
          }));

          // Try to use the Proxy Server if available
          if (RENDER_PROXY_URL && PROXY_SECRET) {
              // Proactively sync cookies in the background every time the portal is opened
              // This ensures the proxy is always warm and has the latest state
              syncWithRemoteProxy(userId, newJar).catch(e => 
                  console.warn(`[ProxySync] Background sync failed for ${userId}:`, e.message)
              );

              try {
                  // If recently verified, we can trust the proxy without a health check
                  if (isRecentlyVerified) {                      const proxyClient = axios.create({
                          baseURL: `${RENDER_PROXY_URL}/proxy/${userId}`,
                          headers: { 'x-proxy-secret': PROXY_SECRET },
                          timeout: 30000
                      });

                      proxyClient.interceptors.request.use((config) => {
                          if (config.url && config.url.startsWith(PORTAL_BASE)) {
                              const urlObj = new URL(config.url);
                              if (config.params) {
                                  Object.entries(config.params).forEach(([key, value]) => {
                                      urlObj.searchParams.append(key, String(value));
                                  });
                                  config.params = {};
                              }
                              const path = urlObj.pathname + urlObj.search;
                              const portalPath = path.startsWith('/LCC') ? path.replace('/LCC', '') : path;
                              config.url = '';
                              config.params = { path: portalPath };
                          }
                          return config;
                      });
                      
                      return { client: proxyClient as any, jar: newJar, isNew: false, userId, isProxy: true };
                  }

                  const synced = await syncWithRemoteProxy(userId, newJar);
                  if (synced) {
                      const proxyClient = axios.create({
                          baseURL: `${RENDER_PROXY_URL}/proxy/${userId}`,
                          headers: { 'x-proxy-secret': PROXY_SECRET },
                          timeout: 30000
                      });

                      proxyClient.interceptors.request.use((config) => {
                          if (config.url && config.url.startsWith(PORTAL_BASE)) {
                              const urlObj = new URL(config.url);
                              if (config.params) {
                                  Object.entries(config.params).forEach(([key, value]) => {
                                      urlObj.searchParams.append(key, String(value));
                                  });
                                  config.params = {};
                              }
                              const path = urlObj.pathname + urlObj.search;
                              const portalPath = path.startsWith('/LCC') ? path.replace('/LCC', '') : path;
                              config.url = '';
                              config.params = { path: portalPath };
                          }
                          return config;
                      });

                      try {
                          await proxyClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`, { timeout: 5000 });
                          return { client: proxyClient as any, jar: newJar, isNew: false, userId, isProxy: true };
                      } catch (e: any) {
                          console.warn(`[Proxy] Re-verification failed for ${userId}, falling back to local.`);
                      }
                  }
              } catch (proxyError: any) {
                  console.warn(`[Proxy] Failed to use proxy for ${userId}, falling back to local:`, proxyError.message);
              }
          }

          // Local re-verification if proxy failed or was skipped
          if (isRecentlyVerified) {
              return { client: hydratedLocalClient, jar: newJar, isNew: false, userId };
          }

          const testRes = await hydratedLocalClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`);
          if (!testRes.data.includes('obtnLogin') && !testRes.data.includes('otbUserID')) {
            if (consecutiveFailures > 0) {
                await setDoc(sessionRef, { consecutive_failures: 0 }, { merge: true });
            }
            return { client: hydratedLocalClient, jar: newJar, isNew: false, userId };
          }
        } catch (e) {
          console.warn('Failed to rehydrate session, starting fresh:', e);
        }
      }
    }
  } catch (error) {
    console.error('Session Proxy retrieval error:', error);
  }

  // IMPORTANT: For NEW sessions (Login), ALWAYS use local client to ensure cookies are captured correctly
  return { client: localClient, jar, isNew: true, userId };
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

export async function acquireRefreshLock(userId: string): Promise<boolean> {
    try {
        const sessionRef = doc(db, 'portal_sessions', userId);
        const lockDuration = 60 * 1000;

        return await runTransaction(db, async (transaction) => {
            const sessionSnap = await transaction.get(sessionRef);
            const now = Date.now();
            
            if (sessionSnap.exists()) {
                const data = sessionSnap.data();
                const lockUntil = data.refresh_lock_until?.toDate ? data.refresh_lock_until.toDate() : new Date(0);
                if (now < lockUntil.getTime()) return false;
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
