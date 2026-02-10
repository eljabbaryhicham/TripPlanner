
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, Trash2, Copy, AlertTriangle, PlayCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from '../ui/aspect-ratio';

type CloudinaryMedia = {
  public_id: string;
  secure_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
  resource_type: 'image' | 'video';
};

const MediaCard = ({ media, onDelete }: { media: CloudinaryMedia, onDelete: (publicId: string) => void }) => {
    const { toast } = useToast();

    const copyUrl = () => {
        navigator.clipboard.writeText(media.secure_url);
        toast({ title: 'URL Copied!', description: 'The media URL has been copied to your clipboard.' });
    };
    
    return (
        <Card className="overflow-hidden">
            <AspectRatio ratio={1 / 1} className="bg-muted relative">
                <Image src={media.thumbnail_url} alt={media.public_id} fill className="object-cover" />
                {media.resource_type === 'video' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                )}
            </AspectRatio>
            <div className="p-2 flex items-center justify-end gap-2 bg-background/50">
                <Button variant="ghost" size="icon" onClick={copyUrl}><Copy className="h-4 w-4" /></Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the media from Cloudinary. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(media.public_id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>
    );
};

export default function MediaLibrary() {
  const { toast } = useToast();
  const [media, setMedia] = React.useState<CloudinaryMedia[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isConfigured, setIsConfigured] = React.useState(true);
  const [isCheckingConfig, setIsCheckingConfig] = React.useState(true);

  React.useEffect(() => {
    const checkConfig = async () => {
        try {
            const res = await fetch('/api/media/status');
            const data = await res.json();
            setIsConfigured(data.configured);
        } catch {
            setIsConfigured(false);
        } finally {
            setIsCheckingConfig(false);
        }
    };
    checkConfig();
  }, []);

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
    if (isConfigured && !isCheckingConfig) {
        fetchMedia();
    }
  }, [fetchMedia, isConfigured, isCheckingConfig]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      toast({ title: 'Upload Successful', description: 'Your media has been added to the library.' });
      fetchMedia(); // Refresh the media list
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: e.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDelete = async (publicId: string) => {
    try {
        const res = await fetch('/api/media/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId })
        });
        if(!res.ok) throw new Error('Failed to delete media');
        
        toast({ title: 'Media Deleted' });
        setMedia(prev => prev.filter(m => m.public_id !== publicId));
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  if (isCheckingConfig) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Media Library</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            </CardContent>
        </Card>
    );
  }

  if (!isConfigured) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Action Required</CardTitle>
                <CardDescription>To use the Media Library, you need to configure your Cloudinary environment variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) in your project's .env file. Please add them and restart the server.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div>
                <CardTitle>Media Library</CardTitle>
                <CardDescription>Upload, manage, and use media from your Cloudinary account.</CardDescription>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 animate-spin" /> : <UploadCloud className="mr-2" />}
                Upload Media
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                className="hidden" 
                accept="image/*,video/*"
            />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <AspectRatio ratio={1/1} key={i} className="bg-muted animate-pulse rounded-md" />)}
          </div>
        ) : error ? (
            <p className="text-destructive text-center">{error}</p>
        ) : media.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Your media library is empty. Upload an image or video to get started.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item) => (
              <MediaCard key={item.public_id} media={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
