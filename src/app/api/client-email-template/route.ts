
import { NextResponse } from 'next/server';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';

function getAdminFirestore(): Firestore {
    if (getApps().length > 0) {
        return getFirestore(getApp());
    }
    const app = initializeApp();
    return getFirestore(app);
}

export async function GET() {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection('email_templates').doc('client_confirmation').get();
    if (!doc.exists) {
      const defaultTemplate = `<h3>Confirmation for {{serviceName}}</h3><p>Hi {{name}},</p><p>We have received your inquiry and will get back to you soon.</p>`;
      return NextResponse.json({ template: defaultTemplate });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Failed to read client email template from Firestore:', error);
    return NextResponse.json({ error: 'Could not load client email template from Firestore.' }, { status: 500 });
  }
}

    