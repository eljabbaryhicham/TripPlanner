
import { initializeApp, getApps, getApp, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;

if (getApps().length === 0) {
    adminApp = initializeApp({
        credential: applicationDefault(),
    });
} else {
    adminApp = getApp();
}

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

export { adminApp, adminAuth, adminFirestore };
