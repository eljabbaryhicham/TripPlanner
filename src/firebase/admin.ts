
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

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
    // In Google Cloud environments (like App Hosting), the SDK should automatically
    // discover credentials. Explicitly providing the project ID can resolve
    // issues where auto-discovery might be ambiguous.
    const app = initializeApp({
        // GCLOUD_PROJECT is a standard environment variable in Google Cloud.
        // As a fallback, we use the project ID from the client-side config.
        projectId: process.env.GCLOUD_PROJECT || firebaseConfig.projectId,
    });
        
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
