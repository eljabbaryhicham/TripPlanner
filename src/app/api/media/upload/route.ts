
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
    // In a production app, you MUST add authentication here to ensure
    // only authorized administrators can upload files.
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    try {
        const buffer = await file.arrayBuffer();
        const base64String = Buffer.from(buffer).toString('base64');
        const dataUri = `data:${file.type};base64,${base64String}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'triplanner',
            resource_type: 'auto',
        });
        
        const uploadMarker = '/upload/';
        const markerIndex = uploadResult.secure_url.indexOf(uploadMarker);
        
        let optimizedUrl = uploadResult.secure_url;

        if (markerIndex !== -1) {
            const baseUrl = uploadResult.secure_url.substring(0, markerIndex);
            const path = uploadResult.secure_url.substring(markerIndex + uploadMarker.length);
            let transformations;

            if (uploadResult.resource_type === 'image') {
                transformations = 'f_auto,q_auto';
                optimizedUrl = `${baseUrl}${uploadMarker}${transformations}/${path}`;
            } else if (uploadResult.resource_type === 'video') {
                transformations = 'f_auto,vc_auto';
                optimizedUrl = `${baseUrl}${uploadMarker}${transformations}/${path}`;
            }
        }

        return NextResponse.json({
            url: optimizedUrl,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }
}
