
import { NextResponse } from 'next/server';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, getApp, App, applicationDefault } from 'firebase-admin/app';

function getAdminFirestore(): Firestore {
    if (getApps().length > 0) {
        return getFirestore(getApp());
    }
    const app = initializeApp({
        credential: applicationDefault()
    });
    return getFirestore(app);
}

export async function GET() {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection('app_settings').doc('general').get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Settings not found in Firestore.' }, { status: 404 });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Failed to read settings from Firestore:', error);
    return NextResponse.json({ error: 'Could not load settings from Firestore.' }, { status: 500 });
  }
}
