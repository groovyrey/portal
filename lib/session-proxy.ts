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
    headers: DEFAULT_HEADERS
  }));

  try {
    const sessionRef = doc(db, 'portal_sessions', userId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      if (data.encryptedJar) {
        try {
          const decrypted = decrypt(data.encryptedJar);
          const jarData = JSON.parse(decrypted);
          
          // Re-hydrate the jar
          const newJar = CookieJar.fromJSON(jarData);
          const hydratedClient = wrapper(axios.create({ 
            jar: newJar, 
            withCredentials: true,
            headers: DEFAULT_HEADERS
          }));

          // Test if session is still alive by visiting the Main page
          // (Brief ping - lightweight)
          const testRes = await hydratedClient.get(`${PORTAL_BASE}/Student/Main.aspx?_sid=${userId}`);
          
          if (!testRes.data.includes('obtnLogin') && !testRes.data.includes('otbUserID')) {
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

export async function saveSession(userId: string, jar: CookieJar) {
  try {
    const jarJson = JSON.stringify(jar.toJSON());
    const encrypted = encrypt(jarJson);
    
    await setDoc(doc(db, 'portal_sessions', userId), {
      encryptedJar: encrypted,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to save portal session:', error);
  }
}
