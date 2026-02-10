
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  // In a production app, you MUST add authentication here to ensure
  // only authorized administrators can access this endpoint.
  try {
    const { resources } = await cloudinary.search
      .expression('folder:triplanner')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
    
    // Add thumbnail for videos
    const media = resources.map((r: any) => {
        if (r.resource_type === 'video') {
            return {
                ...r,
                thumbnail_url: cloudinary.url(r.public_id, {
                    resource_type: 'video',
                    format: 'jpg',
                    crop: 'thumb',
                    width: 300,
                    height: 300,
                })
            }
        }
        return { ...r, thumbnail_url: r.secure_url };
    });
    
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Failed to fetch media from Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 500 });
  }
}
