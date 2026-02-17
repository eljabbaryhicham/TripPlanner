
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
    // If the app is already initialized, just get the services. This is the common case.
    if (getApps().length > 0) {
        const app = getApp();
        return {
            adminApp: app,
            adminAuth: getAuth(app),
            adminFirestore: getFirestore(app),
        };
    }
    
    // If no app is initialized, create a new one.
    // When running in a Google Cloud environment like App Hosting,
    // initializeApp() with no arguments automatically discovers credentials.
    const app = initializeApp();
        
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
