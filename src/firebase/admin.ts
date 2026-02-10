import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Initialize the app only if it's not already been initialized.
// This is the recommended pattern for server environments where code might be re-evaluated.
if (getApps().length === 0) {
  // When running in a Google Cloud environment like App Hosting,
  // initializeApp() with no arguments automatically discovers credentials.
  admin.initializeApp();
}

// Export the initialized services directly.
// These are now singletons for the lifetime of the module.
const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
