import { initializeApp, getApps, getApp, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Define a type for our services object for clarity
interface AdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminFirestore: Firestore;
}

// A cached instance of the services
let services: AdminServices | null = null;

/**
 * Initializes and/or returns the Firebase Admin SDK services.
 * This function ensures that the SDK is initialized only once.
 * @returns An object containing the initialized admin services.
 */
export function getAdminServices(): AdminServices {
    // If services are already initialized, return the cached instance.
    if (services) {
        return services;
    }

    // If no apps are initialized, initialize a new one.
    if (getApps().length === 0) {
        const adminApp = initializeApp({
            credential: applicationDefault(),
        });
        
        // Cache the services
        services = {
            adminApp,
            adminAuth: getAuth(adminApp),
            adminFirestore: getFirestore(adminApp),
        };
    } else {
        // If an app is already initialized, get it and its services.
        const adminApp = getApp();
        services = {
            adminApp,
            adminAuth: getAuth(adminApp),
            adminFirestore: getFirestore(adminApp),
        };
    }
    
    return services;
}
