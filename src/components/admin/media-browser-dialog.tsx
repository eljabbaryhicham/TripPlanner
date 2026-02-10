
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, UploadCloud, PlayCircle } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '@/components/ui/progress';

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

const SelectableMediaCard = ({ media, onSelect }: { media: CloudinaryMedia, onSelect: (url: string) => void }) => {
    return (
        <button
            type="button"
            className="block w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => onSelect(media.secure_url)}
        >
            <AspectRatio ratio={1 / 1} className="bg-muted relative">
                 <Image src={media.thumbnail_url} alt={media.public_id} fill className="object-cover" />
                 {media.resource_type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                )}
            </AspectRatio>
        </button>
    );
};

export function MediaBrowserDialog({ isOpen, onClose, onSelect }: MediaBrowserDialogProps) {
  const { toast } = useToast();
  const [media, setMedia] = React.useState<CloudinaryMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
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
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/media/upload', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (xhr.status >= 200 && xhr.status < 300) {
        toast({ title: 'Upload Successful' });
        fetchMedia();
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          toast({ variant: 'destructive', title: 'Upload Failed', description: errorData.error || 'An unknown error occurred.' });
        } catch {
          toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not parse error response.' });
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'A network error occurred.' });
    };
    
    xhr.send(formData);
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
                        accept="image/*,video/*"
                    />
                </div>
            </DialogHeader>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-4">
                    {isUploading && uploadProgress !== null && (
                        <div className="mb-4 space-y-2 sticky top-0 bg-background z-10 py-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium text-muted-foreground">Uploading...</p>
                                <p className="text-sm font-medium text-muted-foreground">{uploadProgress}%</p>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}
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
