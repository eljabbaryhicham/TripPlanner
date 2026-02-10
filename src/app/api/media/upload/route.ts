'use server';

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // Convert the file to a buffer and then to a Base64 Data URI.
        // This is a more robust method than streaming the buffer directly in some environments.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Use the standard uploader with the data URI.
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'triplanner',
            resource_type: 'auto', // Let Cloudinary detect the resource type.
        });

        // CRITICAL: Explicitly check for a valid result.
        if (!uploadResult || !uploadResult.public_id) {
            throw new Error('Cloudinary upload failed: The server returned an invalid result.');
        }

        let optimizedUrl;
        if (uploadResult.resource_type === 'image') {
            optimizedUrl = cloudinary.url(uploadResult.public_id, {
                transformation: [{ width: 'auto', crop: 'scale', fetch_format: 'auto', quality: 'auto' }]
            });
        } else if (uploadResult.resource_type === 'video') {
            optimizedUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'video',
                transformation: [{ fetch_format: 'auto', video_codec: 'auto' }]
            });
        } else {
            optimizedUrl = uploadResult.secure_url;
        }

        return NextResponse.json({
            url: optimizedUrl,
            public_id: uploadResult.public_id
        });

    } catch (error: any) {
        console.error('Upload API route failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
