import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with safety check
let db: any;
let auth: any;
const googleProvider = new GoogleAuthProvider();

// Request additional scopes if we want to sync Calendar later
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

try {
  const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.warn('CRITICAL: Firebase API Key is missing. Check your .env.local file.');
  }
  
  // App for Firestore (lccportal)
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
  auth = getAuth(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { db, auth, googleProvider };
