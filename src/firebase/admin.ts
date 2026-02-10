
import { initializeApp, getApps, App, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

let app: App;

// This logic ensures that we don't try to re-initialize the app in environments
// where the module is cached (like during development with hot-reloading).
if (getApps().length === 0) {
  // By explicitly providing the projectId, we remove any ambiguity for the
  // applicationDefault() credential to know which project to authenticate against.
  // This is a robust solution for the "failed to fetch access token" error.
  app = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });
} else {
  // If the app is already initialized, we retrieve the existing instance.
  app = getApp();
}

const adminAuth: Auth = getAuth(app);
const adminFirestore: Firestore = getFirestore(app);

// Export the initialized services directly.
// This ensures they are stable singletons for the server's lifecycle.
export { adminAuth, adminFirestore };
