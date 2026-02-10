import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This is a singleton pattern to ensure it only runs once.
 */
function initializeAdminApp() {
  if (getApps().length === 0) {
    // When running in a Google Cloud environment like App Hosting,
    // initializeApp() with no arguments automatically discovers credentials.
    initializeApp();
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
