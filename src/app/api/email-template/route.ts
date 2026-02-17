
import { NextResponse } from 'next/server';
import { getAdminServices } from '@/firebase/admin';
import adminTemplateFromFile from '@/lib/email-template.json';

interface TemplateFile {
  template: string;
}

export async function GET() {
  try {
    const { adminFirestore } = getAdminServices();
    const db = adminFirestore;
    const doc = await db.collection('email_templates').doc('admin_notification').get();
    if (!doc.exists || !doc.data()?.template) {
      return NextResponse.json({ template: (adminTemplateFromFile as TemplateFile).template });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Failed to read email template from Firestore:', error);
    return NextResponse.json({ template: (adminTemplateFromFile as TemplateFile).template });
  }
}
