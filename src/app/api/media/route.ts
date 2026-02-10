
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
        const uploadMarker = '/upload/';
        const markerIndex = r.secure_url.indexOf(uploadMarker);

        let optimizedUrl = r.secure_url;
        let thumbnailUrl;

        if (markerIndex !== -1) {
            const baseUrl = r.secure_url.substring(0, markerIndex);
            const path = r.secure_url.substring(markerIndex + uploadMarker.length);

            if (r.resource_type === 'image') {
                const transformations = 'f_auto,q_auto';
                optimizedUrl = `${baseUrl}${uploadMarker}${transformations}/${path}`;
                thumbnailUrl = cloudinary.url(r.public_id, {
                    resource_type: 'image',
                    transformation: [
                        {width: 300, height: 300, crop: 'thumb', gravity: 'auto'},
                        {quality: 'auto', fetch_format: 'auto'}
                    ]
                });
            } else if (r.resource_type === 'video') {
                const transformations = 'f_auto,vc_auto';
                optimizedUrl = `${baseUrl}${uploadMarker}${transformations}/${path}`;
                thumbnailUrl = cloudinary.url(r.public_id, {
                    resource_type: 'video',
                    format: 'jpg',
                    crop: 'thumb',
                    width: 300,
                    height: 300,
                });
            } else {
                 thumbnailUrl = r.secure_url;
            }
        } else {
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
