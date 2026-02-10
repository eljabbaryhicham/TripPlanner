
import admin from 'firebase-admin';

// This function ensures Firebase is initialized only once.
function initializeAdminApp() {
  if (!admin.apps.length) {
    // In a managed environment like Firebase App Hosting or Cloud Run,
    // initializeApp() without arguments will use the default service account.
    admin.initializeApp();
  }
}

// Export functions that return the services on-demand.
// This lazy-loads the services and ensures initialization has occurred.
export const getAuthAdmin = () => {
  initializeAdminApp();
  return admin.auth();
};

export const getFirestoreAdmin = () => {
  initializeAdminApp();
  return admin.firestore();
};
