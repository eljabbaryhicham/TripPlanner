
import { initializeApp, getApps, App, getApp, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;

// This logic is designed to work in a server environment where `initializeApp`
// should ideally be called only once.
if (getApps().length === 0) {
  // Explicitly use the Application Default Credentials from the environment.
  // This is the most robust way to authenticate in a Google Cloud environment.
  app = initializeApp({
    credential: applicationDefault(),
  });
} else {
  // If the app is already initialized (e.g., in a hot-reload development environment),
  // just get a reference to it.
  app = getApp();
}

const adminAuth: Auth = getAuth(app);
const adminFirestore: Firestore = getFirestore(app);

// Export the initialized services directly.
// This ensures they are singletons for the server's lifecycle.
export { adminAuth, adminFirestore };
