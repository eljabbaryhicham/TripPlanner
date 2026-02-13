
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/firebase/admin';

export async function GET() {
  try {
    const db = adminFirestore;
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
