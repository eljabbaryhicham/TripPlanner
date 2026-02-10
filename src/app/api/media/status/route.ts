import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  return NextResponse.json({ configured: isConfigured });
}
