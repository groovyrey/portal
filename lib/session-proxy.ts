import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { db } from './db';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { encrypt, decrypt } from './auth';
import { PORTAL_BASE } from './constants';

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
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
};

export async function getSessionClient(userId: string): Promise<SessionResult> {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ 
    jar, 
    withCredentials: true,
    headers: DEFAULT_HEADERS,
    timeout: 15000 // 15s timeout to prevent hanging
  }));

  try {
    const sessionRef = doc(db, 'portal_sessions', userId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      
      // Check for account lockout/cooldown
      const lastAttempt = data.last_attempt_at?.toDate ? data.last_attempt_at.toDate() : new Date(0);
      const consecutiveFailures = data.consecutive_failures || 0;
      
      // If we had many failures, wait longer (Exponential backoff-ish)
      const cooldownMs = Math.min(consecutiveFailures * 2 * 60 * 1000, 30 * 60 * 1000); // Max 30 mins
      if (consecutiveFailures >= 3 && (Date.now() - lastAttempt.getTime()) < cooldownMs) {
          console.warn(`Session for ${userId} is in cooldown due to ${consecutiveFailures} failures.`);
          return { client, jar, isNew: false, userId, isLocked: true, consecutiveFailures };
      }

      // Check for active refresh lock (prevent parallel logins)
      const lockUntil = data.refresh_lock_until?.toDate ? data.refresh_lock_until.toDate() : new Date(0);
      if (Date.now() < lockUntil.getTime()) {
          console.log(`Session for ${userId} is currently being refreshed by another process.`);
          // If locked, we still return the client but mark it as locked so the caller can decide to wait or skip
          return { client, jar, isNew: false, userId, isLocked: true };
      }

      if (data.encryptedJar) {
        try {
          const decrypted = decrypt(data.encryptedJar);
          const jarData = JSON.parse(decrypted);
          
          const newJar = CookieJar.fromJSON(jarData);
          const hydratedClient = wrapper(axios.create({ 
            jar: newJar, 
            withCredentials: true,
            headers: DEFAULT_HEADERS,
            timeout: 10000
          }));

          const testRes = await hydratedClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`);
          
          if (!testRes.data.includes('obtnLogin') && !testRes.data.includes('otbUserID')) {
            // Success! Reset failure count if it was high
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
        // Increment failure count
        const snap = await getDoc(sessionRef);
        const currentFailures = snap.exists() ? (snap.data().consecutive_failures || 0) : 0;
        await setDoc(sessionRef, {
            consecutive_failures: currentFailures + 1,
            last_attempt_at: serverTimestamp(),
            refresh_lock_until: new Date(0) // Release lock
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
      refresh_lock_until: new Date(0) // Release lock
    }, { merge: true });
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
        const lockUntil = new Date(Date.now() + lockDuration);

        await setDoc(sessionRef, {
            refresh_lock_until: lockUntil,
            last_attempt_at: serverTimestamp()
        }, { merge: true });
        
        return true;
    } catch (e) {
        console.error('Failed to acquire lock:', e);
        return false;
    }
}
