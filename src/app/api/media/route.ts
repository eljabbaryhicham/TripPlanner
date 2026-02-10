import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  // In a production app, you MUST add authentication here to ensure
  // only authorized administrators can access this endpoint.
  try {
    const { resources } = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
    
    return NextResponse.json({ media: resources });
  } catch (error) {
    console.error('Failed to fetch media from Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 500 });
  }
}
