'use client';

import * as React from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import { ScrollArea } from '../ui/scroll-area';

type CloudinaryMedia = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
};

interface MediaBrowserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const SelectableMediaCard = ({ media, onSelect }: { media: CloudinaryMedia, onSelect: (url: string) => void }) => {
    return (
        <button
            type="button"
            className="block w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => onSelect(media.secure_url)}
        >
            <AspectRatio ratio={1 / 1} className="bg-muted">
                 <Image src={media.secure_url} alt={media.public_id} fill className="object-cover" />
            </AspectRatio>
        </button>
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

  const fetchMedia = React.useCallback(async () => {
    setIsLoading(true);
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
        // Check config status when dialog opens
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      toast({ title: 'Upload Successful' });
      fetchMedia();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
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
                        accept="image/png, image/jpeg, image/gif, image/webp"
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
                                <SelectableMediaCard key={item.public_id} media={item} onSelect={onSelect} />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </DialogContent>
    </Dialog>
  );
}
