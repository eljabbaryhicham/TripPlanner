
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
 * This function ensures the SDK is initialized only once per instance by checking if an app is already initialized.
 * @returns An object containing the initialized admin services.
 */
export function getAdminServices(): AdminServices {
    // getApps() returns an array of all initialized apps. If it's not empty, we get the default app.
    // Otherwise, we initialize a new app. This is idempotent and safe to call multiple times in a serverless environment.
    const app = getApps().length > 0 
        ? getApp() 
        : initializeApp();
        
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
