'use server';

import { initializeApp, getApps, App, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
  // In a Google Cloud environment (like App Hosting or Cloud Functions), 
  // initializeApp() with no arguments automatically uses the environment's 
  // service account credentials. This is the most secure and robust method for production.
  app = initializeApp();
} else {
  // If the app is already initialized (e.g., in a hot-reload development environment),
  // just get a reference to it.
  app = getApp();
}

const adminAuth: Auth = getAuth(app);
const adminFirestore: Firestore = getFirestore(app);

// Export the initialized services directly.
// This ensures they are singletons for the server's lifecycle.
export { adminAuth, adminFirestore };
