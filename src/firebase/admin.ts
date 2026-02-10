
import { initializeApp, getApps, App, applicationDefault, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: applicationDefault(),
  });
} else {
  adminApp = getApp();
}

const adminAuth: Auth = getAuth(adminApp);
const adminFirestore: Firestore = getFirestore(adminApp);

export { adminAuth, adminFirestore };
