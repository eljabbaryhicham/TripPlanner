import { initializeApp, getApps, getApp, applicationDefault, App } from 'firebase-admin/app';
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
    const app = getApps().length === 0 ? initializeApp({ credential: applicationDefault() }) : getApp();
    
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
