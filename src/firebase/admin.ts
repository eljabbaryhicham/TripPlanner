import admin from 'firebase-admin';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This function is designed to be lazy-loaded and called only when admin services are needed.
 */
function initializeAdminApp() {
  // Check if any apps are already initialized to prevent re-initialization.
  if (getApps().length === 0) {
    // When running in a Google Cloud environment (like App Hosting),
    // using applicationDefault() allows the SDK to automatically discover
    // the service account credentials from the environment.
    initializeApp({
      credential: applicationDefault(),
    });
  }
}

/**
 * Gets the initialized Firestore Admin service.
 * This function ensures the app is initialized before returning the service.
 * @returns {admin.firestore.Firestore} The Firestore service instance.
 */
export function getFirestoreAdmin() {
  initializeAdminApp();
  return admin.firestore();
}

/**
 * Gets the initialized Auth Admin service.
 * This function ensures the app is initialized before returning the service.
 * @returns {admin.auth.Auth} The Auth service instance.
 */
export function getAuthAdmin() {
  initializeAdminApp();
  return admin.auth();
}
