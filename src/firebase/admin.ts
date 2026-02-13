
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Define a type for our services object for clarity
interface AdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminFirestore: Firestore;
}

/**
 * Initializes and/or returns the Firebase Admin SDK services.
 * This function is safe for serverless environments and ensures the SDK is initialized only once per instance.
 * @returns An object containing the initialized admin services.
 */
export function getAdminServices(): AdminServices {
    // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
    // automatically uses the project's default service account credentials.
    // This is the most robust method for this environment.
    const app = getApps().length === 0 ? initializeApp() : getApp();
    
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
