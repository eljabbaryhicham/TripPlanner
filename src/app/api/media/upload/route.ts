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
        let thumbnailUrl;

        if (uploadResult.resource_type === 'image') {
            optimizedUrl = cloudinary.url(uploadResult.public_id, {
                transformation: [{ width: 'auto', crop: 'scale', fetch_format: 'auto', quality: 'auto:good' }]
            });
            thumbnailUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'image',
                transformation: [
                    {width: 300, height: 300, crop: 'thumb', gravity: 'auto'},
                    {quality: 'auto:eco', fetch_format: 'auto'}
                ]
            });
        } else if (uploadResult.resource_type === 'video') {
            optimizedUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'video',
                transformation: [{ fetch_format: 'auto', video_codec: 'auto' }]
            });
            thumbnailUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'video',
                format: 'jpg',
                crop: 'thumb',
                width: 300,
                height: 300,
            });
        } else {
             optimizedUrl = uploadResult.secure_url;
             thumbnailUrl = uploadResult.secure_url;
        }
        
        const newMediaItem = { 
            ...uploadResult,
            secure_url: optimizedUrl, 
            thumbnail_url: thumbnailUrl 
        };

        return NextResponse.json({ media: newMediaItem });

    } catch (error: any) {
        console.error('Upload API route failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
