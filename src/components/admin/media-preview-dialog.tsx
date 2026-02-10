'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Plyr from 'plyr-react';

type CloudinaryMedia = {
  public_id: string;
  secure_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  resource_type: 'image' | 'video';
};

interface MediaPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    media: CloudinaryMedia | null;
}

export function MediaPreviewDialog({ isOpen, onClose, media }: MediaPreviewDialogProps) {
    if (!media) {
        return null;
    }

    const videoSource: Plyr.SourceInfo = {
        type: 'video',
        sources: [
            {
                src: media.secure_url,
                // Cloudinary's f_auto will determine the type, but we can give a hint.
                // It's often mp4, but could be webm etc. Let's let the browser decide.
            },
        ],
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 border-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Media Preview: {media.public_id}</DialogTitle>
                </DialogHeader>
                <div className="bg-black flex items-center justify-center max-h-[85vh]">
                    {media.resource_type === 'image' ? (
                        <Image
                            src={media.secure_url}
                            alt={media.public_id}
                            width={media.width}
                            height={media.height}
                            className="object-contain max-w-full max-h-full"
                        />
                    ) : (
                        <div className="w-full h-full max-w-full max-h-full">
                           <Plyr source={videoSource} options={{ controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] }} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
