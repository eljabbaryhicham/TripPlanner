
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

        // Upload the raw file without incoming transformations
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'triplanner',
            resource_type: 'auto',
        });
        
        // Manually construct the URL with transformations
        const urlParts = uploadResult.secure_url.split('/upload/');
        const baseUrl = urlParts[0];
        const pathWithVersion = urlParts[1];
        let optimizedUrl;

        if (uploadResult.resource_type === 'image') {
            const transformations = 'w_auto,c_scale,f_auto,q_auto';
            optimizedUrl = `${baseUrl}/upload/${transformations}/${pathWithVersion}`;
        } else if (uploadResult.resource_type === 'video') {
            const transformations = 'f_auto,vc_auto';
            optimizedUrl = `${baseUrl}/upload/${transformations}/${pathWithVersion}`;
        } else {
            // Fallback for other resource types
            optimizedUrl = uploadResult.secure_url;
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
