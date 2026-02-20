import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (serviceAccountJson) {
      // Handle potential wrapping quotes from environment variable injection
      const sanitizedJson = serviceAccountJson.trim().replace(/^['"]|['"]$/g, '');
      const serviceAccount = JSON.parse(sanitizedJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized with service account.');
    } else {
      // Fallback for environments where service account is provided via other means (e.g., ADC on GCP)
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.warn('Firebase Admin initialized without explicit service account. Ensure ADC is configured.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const messaging = admin.messaging();
export const adminDb = admin.firestore();
