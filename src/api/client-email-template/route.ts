
import { NextResponse } from 'next/server';
import { getAdminServices } from '@/firebase/admin';
import clientTemplateFromFile from '@/lib/client-email-template.json';

export async function GET() {
  try {
    const { adminFirestore } = getAdminServices();
    const db = adminFirestore;
    const doc = await db.collection('email_templates').doc('client_confirmation').get();
    if (!doc.exists() || !doc.data()?.template) {
      return NextResponse.json({ template: clientTemplateFromFile.template });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Failed to read client email template from Firestore:', error);
    return NextResponse.json({ template: clientTemplateFromFile.template });
  }
}
