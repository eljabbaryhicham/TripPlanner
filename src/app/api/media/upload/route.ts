
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

        const uploadOptions: any = {
            folder: 'triplanner',
            resource_type: 'auto',
        };

        if (file.type.startsWith('image/')) {
            // For images, optimize quality and format. `w_auto` and `c_scale` are delivery-time transformations.
            uploadOptions.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
        } else if (file.type.startsWith('video/')) {
            // For videos, optimize format and codec.
            uploadOptions.transformation = [{ fetch_format: 'auto', video_codec: 'auto' }];
        }

        const uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions);

        return NextResponse.json({
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }
}
