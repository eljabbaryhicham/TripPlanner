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
            // Auto-optimization settings
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        });

        return NextResponse.json({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }
}
