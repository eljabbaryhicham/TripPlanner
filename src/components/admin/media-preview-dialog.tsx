'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    const [PlyrComponent, setPlyrComponent] = React.useState<React.ComponentType<any> | null>(null);

    React.useEffect(() => {
        if (isOpen && media?.resource_type === 'video' && !PlyrComponent) {
            import('plyr-react').then(module => {
                setPlyrComponent(() => module.default);
            });
        }
    }, [isOpen, media, PlyrComponent]);

    if (!media) {
        return null;
    }

    const videoSource = {
        type: 'video' as const,
        sources: [
            {
                src: media.secure_url,
            },
        ],
    };
    
    // Dynamically set the aspect ratio for the player
    const videoOptions = {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        ratio: `${media.width}:${media.height}`
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[80vw] h-[80vh] p-0 border-0 bg-transparent shadow-none flex items-center justify-center">
                <DialogHeader className="sr-only">
                    <DialogTitle>Media Preview: {media.public_id}</DialogTitle>
                </DialogHeader>
                
                {media.resource_type === 'image' ? (
                    <Image
                        src={media.secure_url}
                        alt={media.public_id}
                        width={media.width}
                        height={media.height}
                        className="object-contain max-w-full max-h-full rounded-lg"
                    />
                ) : (
                    // This container ensures the player respects the dialog's max-width/max-height.
                    <div className="w-full h-full">
                       {PlyrComponent && <PlyrComponent source={videoSource} options={videoOptions} />}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
