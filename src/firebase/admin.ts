
import { initializeApp, getApps, App, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;

// This logic ensures that we don't try to re-initialize the app in environments
// where the module is cached (like during development with hot-reloading).
if (getApps().length === 0) {
  // In Google Cloud environments (like Firebase App Hosting),
  // initializeApp() with no arguments will automatically discover
  // the project configuration and credentials. This is the most robust method.
  app = initializeApp();
} else {
  // If the app is already initialized, we retrieve the existing instance.
  app = getApp();
}

const adminAuth: Auth = getAuth(app);
const adminFirestore: Firestore = getFirestore(app);

// Export the initialized services directly.
// This ensures they are stable singletons for the server's lifecycle.
export { adminAuth, adminFirestore };
