
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// Define a type for our services object for clarity
interface AdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminFirestore: Firestore;
}

// Create a global variable to hold the initialized services.
// This is a common pattern to avoid re-initializing on every function call in a serverless environment.
let adminServices: AdminServices | null = null;

function initializeAdminServices(): AdminServices {
    // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
    // automatically uses the project's default service account credentials.
    // By providing the projectId, we ensure it targets the correct project, which can
    // help resolve credential issues in some environments.
    const app = getApps().length === 0 
        ? initializeApp({ projectId: firebaseConfig.projectId }) 
        : getApp();
        
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}

/**
 * Initializes and/or returns the Firebase Admin SDK services.
 * This function ensures the SDK is initialized only once per instance.
 * @returns An object containing the initialized admin services.
 */
export function getAdminServices(): AdminServices {
    if (!adminServices) {
        adminServices = initializeAdminServices();
    }
    return adminServices;
}
