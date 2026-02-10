import { initializeApp, getApps, App, applicationDefault, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * A lazy-loading singleton pattern for the Firebase Admin App.
 * This ensures that initializeApp() is only called once, and only when
 * an admin service is actually requested by a server-side function.
 * This pattern is more robust in serverless environments where startup
 * order and credential availability can be unpredictable.
 */
function getAdminApp(): App {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
  }

  // Otherwise, initialize the app for the first time.
  // Using applicationDefault() allows Firebase to automatically find the
  // service account credentials in the hosting environment.
  const app = initializeApp({
    credential: applicationDefault(),
  });

  return app;
}

/**
 * Gets the Firebase Auth admin instance.
 * It lazily initializes the admin app on first call.
 * @returns {Auth} The Firebase Auth service instance.
 */
export const getAuthAdmin = (): Auth => {
  const app = getAdminApp();
  return getAuth(app);
};

/**
 * Gets the Firestore admin instance.
 * It lazily initializes the admin app on first call.
 * @returns {Firestore} The Firestore service instance.
 */
export const getFirestoreAdmin = (): Firestore => {
  const app = getAdminApp();
  return getFirestore(app);
};
