import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  // In a production app, you MUST add authentication here to ensure
  // only authorized administrators can access this endpoint.
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required.' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({ error: 'Failed to delete media.' }, { status: 500 });
  }
}
