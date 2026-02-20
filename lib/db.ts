import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';

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
let messaging: Messaging | null = null;

try {
  const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.warn('CRITICAL: Firebase API Key is missing. Check your .env.local file.');
  }
  
  // App for Firestore (lccportal)
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);

  // Messaging is disabled for now
  messaging = null;
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { db, messaging };
