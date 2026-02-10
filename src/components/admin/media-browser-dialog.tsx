
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, UploadCloud, PlayCircle, Eye } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import { ScrollArea } from '../ui/scroll-area';
import { MediaPreviewDialog } from './media-preview-dialog';

type CloudinaryMedia = {
  public_id: string;
  secure_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  resource_type: 'image' | 'video';
};

interface MediaBrowserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const SelectableMediaCard = ({ media, onSelect, onPreview }: { media: CloudinaryMedia, onSelect: (url: string) => void, onPreview: () => void }) => {
    return (
        <div className="relative group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
            <button
                type="button"
                className="block w-full"
                onClick={() => onSelect(media.secure_url)}
            >
                <AspectRatio ratio={1 / 1} className="bg-muted">
                    <Image src={media.thumbnail_url} alt={media.public_id} fill className="object-cover transition-transform group-hover:scale-105" />
                    {media.resource_type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <PlayCircle className="h-8 w-8 text-white" />
                        </div>
                    )}
                </AspectRatio>
            </button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-1 right-1 h-7 w-7 text-white bg-black/40 hover:bg-black/70 hover:text-white"
                onClick={onPreview}
            >
                <Eye className="h-4 w-4" />
            </Button>
        </div>
    );
};

export function MediaBrowserDialog({ isOpen, onClose, onSelect }: MediaBrowserDialogProps) {
  const { toast } = useToast();
  const [media, setMedia] = React.useState<CloudinaryMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isConfigured, setIsConfigured] = React.useState(true);
  const [previewItem, setPreviewItem] = React.useState<CloudinaryMedia | null>(null);

  const fetchMedia = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/media');
      if (!res.ok) throw new Error('Failed to fetch media');
      const data = await res.json();
      setMedia(data.media);
    } catch (e: any) {
      setError(e.message);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load media library.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (isOpen) {
        fetch('/api/media/status')
            .then(res => res.json())
            .then(data => {
                setIsConfigured(data.configured);
                if (data.configured) {
                    fetchMedia();
                }
            })
            .catch(() => setIsConfigured(false));
    }
  }, [isOpen, fetchMedia]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
        const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: file,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }

        toast({ title: 'Upload Successful' });
        fetchMedia(); // Refresh the library
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  return (
    <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle>Browse Media Library</DialogTitle>
                            <DialogDescription>Select an image or upload a new one.</DialogDescription>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !isConfigured}>
                            {isUploading ? <Loader2 className="mr-2 animate-spin" /> : <UploadCloud className="mr-2" />}
                            Upload
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload}
                            className="hidden" 
                            accept="image/*,video/*"
                        />
                    </div>
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                        {!isConfigured ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
                                <h3 className="font-semibold">Cloudinary Not Configured</h3>
                                <p className="text-muted-foreground">Please configure Cloudinary credentials in your .env file.</p>
                            </div>
                        ) : isLoading ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {Array.from({ length: 10 }).map((_, i) => <AspectRatio ratio={1/1} key={i} className="bg-muted animate-pulse rounded-md" />)}
                            </div>
                        ) : error ? (
                            <p className="text-destructive text-center">{error}</p>
                        ) : media.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Your media library is empty.</p>
                        ) : (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {media.map((item) => (
                                    <SelectableMediaCard key={item.public_id} media={item} onSelect={onSelect} onPreview={() => setPreviewItem(item)} />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
        <MediaPreviewDialog 
            isOpen={!!previewItem}
            onClose={() => setPreviewItem(null)}
            media={previewItem}
        />
    </>
  );
}
