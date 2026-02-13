
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
    const doc = await db.collection('email_templates').doc('admin_notification').get();
    if (!doc.exists) {
      const defaultTemplate = `<h3>New Booking Inquiry for {{serviceName}}</h3>
<p><strong>Name:</strong> {{name}}</p>
<p><strong>Email:</strong> {{email}}</p>`;
      return NextResponse.json({ template: defaultTemplate });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Failed to read email template from Firestore:', error);
    return NextResponse.json({ error: 'Could not load email template from Firestore.' }, { status: 500 });
  }
}

    