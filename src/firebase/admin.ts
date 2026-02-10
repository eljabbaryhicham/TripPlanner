
import { initializeApp, getApps, App, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface AdminServices {
    adminAuth: Auth;
    adminFirestore: Firestore;
}

let services: AdminServices | null = null;

/**
 * Initializes and/or returns the Firebase Admin SDK services.
 * This uses a lazy initialization pattern to ensure it only runs once per server instance.
 */
export function getAdminServices(): AdminServices {
  if (services) {
    return services;
  }

  let app: App;
  if (getApps().length === 0) {
    // In Google Cloud environments (like Firebase App Hosting),
    // initializeApp() with no arguments will automatically discover
    // the project configuration and credentials. This is the most robust method.
    app = initializeApp();
  } else {
    // If the app is already initialized, we retrieve the existing instance.
    app = getApp();
  }

  services = {
    adminAuth: getAuth(app),
    adminFirestore: getFirestore(app),
  };

  return services;
}
