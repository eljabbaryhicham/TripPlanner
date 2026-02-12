
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
    
    const media = resources.map((r: any) => {
        let optimizedUrl;
        let thumbnailUrl;

        if (r.resource_type === 'image') {
            optimizedUrl = cloudinary.url(r.public_id, {
                transformation: [{ width: 'auto', crop: 'scale', fetch_format: 'auto', quality: 'auto:good' }]
            });
            thumbnailUrl = cloudinary.url(r.public_id, {
                resource_type: 'image',
                transformation: [
                    {width: 300, height: 300, crop: 'thumb', gravity: 'auto'},
                    {quality: 'auto:eco', fetch_format: 'auto'}
                ]
            });
        } else if (r.resource_type === 'video') {
            optimizedUrl = cloudinary.url(r.public_id, {
                resource_type: 'video',
                transformation: [{ fetch_format: 'auto', video_codec: 'auto' }]
            });
            thumbnailUrl = cloudinary.url(r.public_id, {
                resource_type: 'video',
                format: 'jpg',
                crop: 'thumb',
                width: 300,
                height: 300,
            });
        } else {
             optimizedUrl = r.secure_url;
             thumbnailUrl = r.secure_url;
        }
        
        return { 
            ...r,
            secure_url: optimizedUrl, 
            thumbnail_url: thumbnailUrl 
        };
    });
    
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Failed to fetch media from Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 500 });
  }
}
