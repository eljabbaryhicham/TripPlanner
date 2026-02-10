import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  // In a managed environment like Cloud Functions or App Hosting,
  // initializeApp() can be called without arguments. It will automatically
  // discover the project credentials.
  admin.initializeApp();
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
