
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        // Convert the file to a buffer to reliably stream it.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload the buffer to Cloudinary using a stream.
        // This is more memory-efficient for large files.
        const uploadResult: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'triplanner',
                    resource_type: 'auto', // Let Cloudinary detect if it's an image or video
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(error);
                    }
                    // CRITICAL FIX: Check if the result is valid.
                    // This prevents silent failures where no error is thrown but the upload didn't succeed.
                    if (!result || !result.public_id) {
                        console.error("Cloudinary upload failed: Invalid result received.", result);
                        return reject(new Error('Cloudinary upload failed: The server returned an invalid result.'));
                    }
                    resolve(result);
                }
            );
            // Write the buffer to the stream and end it.
            uploadStream.end(buffer);
        });
        
        // This part will only be reached if the promise resolves (i.e., upload is successful)
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
        // This catch block will now correctly handle rejections from the promise
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
