import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
try {
  const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
  
  console.log('--- Firebase Config Debug ---');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);
  console.log('Database ID:', dbId);
  console.log('API Key Present:', !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined');
  console.log('---------------------------');
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.warn('CRITICAL: Firebase API Key is missing. Check your .env.local file.');
  }
  
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // If the user says the name is 'default' (without parentheses), they might have a custom named DB
  // Standard is '(default)', but Enterprise projects can have others.
  db = getFirestore(app, dbId === '(default)' ? undefined : dbId);
  console.log('Firestore initialization command sent.');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { db };
