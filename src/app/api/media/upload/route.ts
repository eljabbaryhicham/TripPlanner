
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { Writable } from 'stream';

// Helper function to pipe a Web ReadableStream to a Node WritableStream
async function pipeWebStreamToNodeWritable(webStream: ReadableStream<Uint8Array>, nodeWritable: Writable) {
    const reader = webStream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                nodeWritable.end();
                break;
            }
            if (!nodeWritable.write(value)) {
                // Handle backpressure
                await new Promise(resolve => nodeWritable.once('drain', resolve));
            }
        }
    } catch (error) {
        const e = error as Error
        nodeWritable.destroy(e);
        throw e;
    }
}


export async function POST(request: Request) {
    if (!request.body) {
        return NextResponse.json({ error: 'No file stream provided.' }, { status: 400 });
    }

    try {
        const uploadResult = await new Promise((resolve, reject) => {
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

            pipeWebStreamToNodeWritable(request.body!, uploadStream).catch(reject);
        });

        const result = uploadResult as any;
        
        let optimizedUrl;

        if (result.resource_type === 'image') {
            optimizedUrl = cloudinary.url(result.public_id, {
                transformation: [{ width: 'auto', crop: 'scale', fetch_format: 'auto', quality: 'auto' }]
            });
        } else if (result.resource_type === 'video') {
            optimizedUrl = cloudinary.url(result.public_id, {
                resource_type: 'video',
                transformation: [{ fetch_format: 'auto', video_codec: 'auto' }]
            });
        } else {
            optimizedUrl = result.secure_url;
        }

        return NextResponse.json({
            url: optimizedUrl,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
        return NextResponse.json({ error: 'Upload failed: ' + errorMessage }, { status: 500 });
    }
}
