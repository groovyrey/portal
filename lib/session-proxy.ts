import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { db } from './db';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { decrypt, encrypt } from './auth';
import { PORTAL_BASE } from './constants';

/**
 * Session Proxy
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
    const sessionRef = doc(db, 'portal_sessions', userId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      const lastUpdate = data.updated_at?.toDate ? data.updated_at.toDate() : new Date(0);
      const lastAttempt = data.last_attempt_at?.toDate ? data.last_attempt_at.toDate() : new Date(0);
      const consecutiveFailures = data.consecutive_failures || 0;
      
      // Trust the session if it was verified in the last 30 minutes (Local Trust)
      const isRecentlyVerified = (Date.now() - lastUpdate.getTime()) < 30 * 60 * 1000;

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
            timeout: 20000
          }));

          // Local re-verification
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
    console.error('Session retrieval error:', error);
  }

  // IMPORTANT: For NEW sessions (Login), ALWAYS use local client
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
