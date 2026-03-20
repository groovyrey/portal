import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let parsedAccount = null;
    const candidates = [
      process.env.FIREBASE_SERVICE_ACCOUNT,
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        // Sanitize JSON string: remove leading/trailing quotes and fix escaped newlines
        const sanitizedJson = candidate.trim().replace(/^['"]|['"]$/g, '');
        parsedAccount = JSON.parse(sanitizedJson);
        if (parsedAccount) break;
      } catch (e) {
        console.warn("Firebase Admin: Failed to parse a service account candidate. Trying next if available.", (e as Error).message);
      }
    }
    
    if (parsedAccount) {
      // Ensure private_key has correct newlines
      if (parsedAccount.private_key) {
        parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(parsedAccount),
      });
      console.log('Firebase Admin initialized with SERVICE_ACCOUNT JSON.');
    } else {
      // Fallback to individual credentials
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        console.log(`Firebase Admin: Initializing with Project ID: ${projectId}`);
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin initialized with individual credentials.');
      } else {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (projectId) {
            admin.initializeApp({
                projectId,
            });
            console.warn('Firebase Admin initialized without explicit credentials. Ensure ADC is configured.');
        } else {
            console.warn('Firebase Admin: No credentials or project ID found. Initialization skipped.');
        }
      }
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    // Re-throw the error so the build/runtime fails visibly rather than with a confusing "default app" error later
    throw error;
  }
}

// Lazy load or check existence to prevent import-time crashes if init failed or was skipped
export const adminDb = admin.apps.length ? admin.firestore() : null as unknown as admin.firestore.Firestore;
export const adminAuth = admin.apps.length ? admin.auth() : null as unknown as admin.auth.Auth;

if (!adminDb) {
    console.error("Firebase Admin DB not initialized. Check your environment variables.");
}

