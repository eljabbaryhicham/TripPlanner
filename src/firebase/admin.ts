
import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';

const ADMIN_APP_NAME = 'firebase-admin-app-triplanner';

/**
 * Initializes and returns a named Firebase Admin app instance.
 * This function is idempotent; it will either create a new app or return
 * the existing one, preventing re-initialization errors. Using a named
 * app helps to isolate it from other potential Firebase initializations.
 * @returns {admin.app.App} The initialized Firebase Admin app instance.
 */
function initializeAdminApp() {
    // Check if the app with the specific name already exists
    if (admin.apps.some((app) => app?.name === ADMIN_APP_NAME)) {
        return admin.app(ADMIN_APP_NAME);
    }
    
    // If it doesn't exist, initialize it
    return admin.initializeApp({
        // applicationDefault() automatically finds credentials in a managed environment
        credential: applicationDefault(),
    }, ADMIN_APP_NAME);
}


/**
 * Gets the initialized Firestore Admin service.
 * This function ensures the admin app is initialized before returning the Firestore service.
 * @returns {admin.firestore.Firestore} The Firestore service instance.
 */
export function getFirestoreAdmin() {
  const app = initializeAdminApp();
  return app.firestore();
}

/**
 * Gets the initialized Auth Admin service.
 * This function ensures the admin app is initialized before returning the Auth service.
 * @returns {admin.auth.Auth} The Auth service instance.
 */
export function getAuthAdmin() {
  const app = initializeAdminApp();
  return app.auth();
}
