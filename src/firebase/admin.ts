
import { initializeApp, getApps, getApp, App, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This function handles initialization and returns the app instance.
function initializeAdminApp(): App {
  // Check if the app is already initialized to avoid errors.
  if (getApps().length > 0) {
    return getApp();
  }

  // Initialize the Firebase Admin SDK.
  // Explicitly using applicationDefault() helps in environments where automatic
  // detection of credentials might be problematic. This is a more robust way
  // to ensure the SDK finds the service account credentials.
  const app = initializeApp({
    credential: applicationDefault(),
  });
  
  return app;
}

// Immediately initialize the app when this module is loaded.
// This creates a single, persistent instance for the server's lifetime.
const adminApp = initializeAdminApp();

// Export getter functions that return the initialized services.
// This ensures any part of the server can access the same SDK instances.
export const getAuthAdmin = (): Auth => {
  return getAuth(adminApp);
};

export const getFirestoreAdmin = (): Firestore => {
  return getFirestore(adminApp);
};
