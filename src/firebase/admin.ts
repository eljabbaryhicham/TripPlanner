
import { initializeApp, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

const ADMIN_APP_NAME = 'admin-sdk-app';

// Define a type for our services object for clarity
interface AdminServices {
  adminApp: App;
  adminAuth: Auth;
  adminFirestore: Firestore;
}

// Function to safely get an initialized app by name, returning null if it doesn't exist.
function getNamedApp(name: string): App | null {
    try {
        return getApp(name);
    } catch (e: any) {
        // "app/no-app" is the error code for a non-existent app, which is expected.
        if (e.code === 'app/no-app') {
            return null;
        }
        // Re-throw any other unexpected errors.
        throw e;
    }
}

/**
 * Initializes and/or returns the Firebase Admin SDK services using a named instance
 * to prevent project conflicts in the server environment.
 * @returns An object containing the initialized admin services.
 */
export function getAdminServices(): AdminServices {
    // 1. Try to get our specifically named app instance.
    let app = getNamedApp(ADMIN_APP_NAME);

    // 2. If it doesn't exist, initialize it with the correct project ID and our unique name.
    // This guarantees that we are connected to the correct Firebase project.
    if (!app) {
        app = initializeApp({
            projectId: 'studio-5965912818-b2790',
        }, ADMIN_APP_NAME);
    }
    
    // 3. Return the services using this guaranteed-to-be-correct app instance.
    return {
        adminApp: app,
        adminAuth: getAuth(app),
        adminFirestore: getFirestore(app),
    };
}
