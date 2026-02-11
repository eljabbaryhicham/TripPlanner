'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    // When deployed to Firebase App Hosting, the FIREBASE_CONFIG env var is automatically set.
    // When deploying to other platforms (like Vercel), we must use our local config file.
    if (process.env.FIREBASE_CONFIG) {
        // We are on Firebase App Hosting, so we can initialize without options.
        firebaseApp = initializeApp();
    } else {
        // We are not on Firebase App Hosting, so we need to provide the config.
        firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
