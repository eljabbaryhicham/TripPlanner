import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
  // Explicitly initialize with the project ID from the environment variable.
  // This can help in environments where automatic detection might be unstable.
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth();

export { firestoreAdmin, authAdmin };
