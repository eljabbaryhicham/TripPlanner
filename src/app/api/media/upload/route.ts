
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Readable } from 'stream';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // Convert the File's web stream to a Node.js stream
        const fileStream = file.stream();
        const nodeStream = Readable.fromWeb(fileStream as any);

        const uploadResult: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'triplanner',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                }
            );
            nodeStream.pipe(uploadStream);
        });
        
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
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
