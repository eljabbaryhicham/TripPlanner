
import { initializeApp, getApps, App, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// A single object to hold our initialized services to avoid re-initializing
let adminServices: { auth: Auth; firestore: Firestore; } | null = null;

function getAdminServices() {
  if (adminServices) {
    return adminServices;
  }

  // Check if the default app is already initialized
  if (!getApps().length) {
    // If not, initialize it. In a Google Cloud environment (like App Hosting),
    // initializeApp() with no arguments automatically uses the environment's
    // service account credentials. This is the most robust method.
    initializeApp();
  }

  // Get the initialized services
  const auth = getAuth();
  const firestore = getFirestore();

  // Cache them
  adminServices = { auth, firestore };

  return adminServices;
}

// Export functions that retrieve the cached services
export function getAdminAuth(): Auth {
    return getAdminServices().auth;
}

export function getAdminFirestore(): Firestore {
    return getAdminServices().firestore;
}
