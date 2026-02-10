
import { initializeApp, getApps, App, applicationDefault, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface AdminServices {
    app: App;
    auth: Auth;
    firestore: Firestore;
}

let services: AdminServices | null = null;

function getAdminServices(): AdminServices {
    if (services) {
        return services;
    }

    let app: App;
    if (getApps().length === 0) {
        app = initializeApp({
            credential: applicationDefault(),
        });
    } else {
        app = getApp();
    }

    services = {
        app,
        auth: getAuth(app),
        firestore: getFirestore(app),
    };

    return services;
}

export function getAdminAuth(): Auth {
    return getAdminServices().auth;
}

export function getAdminFirestore(): Firestore {
    return getAdminServices().firestore;
}
