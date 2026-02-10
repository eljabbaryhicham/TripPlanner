import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

const initializeAdminApp = () => {
  if (getApps().length === 0) {
    // In a managed environment like Cloud Functions or App Hosting,
    // initializeApp() can be called without arguments. It will automatically
    // discover the project credentials.
    admin.initializeApp();
  }
  return admin;
};

// Export getter functions instead of instances
export const getFirestoreAdmin = () => {
  const adminApp = initializeAdminApp();
  return adminApp.firestore();
};

export const getAuthAdmin = () => {
  const adminApp = initializeAdminApp();
  return adminApp.auth();
};
