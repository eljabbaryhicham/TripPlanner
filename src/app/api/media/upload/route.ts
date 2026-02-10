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
        
        // Use the file's stream method to handle large files efficiently
        const fileStream = file.stream();
        
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'triplanner', resource_type: 'auto' },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                }
            );

            // Pipe the file stream to Cloudinary's upload stream
            const reader = fileStream.getReader();
            reader.read().then(function processStream({ done, value }): any {
                if (done) {
                    uploadStream.end();
                    return;
                }
                uploadStream.write(value);
                return reader.read().then(processStream);
            }).catch(reject);
        });

        const uploadResult = result as any;

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
