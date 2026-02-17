'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';
import type { Category } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MediaBrowserDialog } from './media-browser-dialog';
import { ICON_NAMES } from '../icon';
import { Switch } from '../ui/switch';

interface CategoryEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Category) => void;
    category: Category | null;
}

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'),
  href: z.string().startsWith('/', "Href must start with a '/'"),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  enabled: z.boolean(),
});

export const CategoryEditor = ({ isOpen, onClose, onSave, category }: CategoryEditorProps) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form state
    const [name, setName] = React.useState('');
    const [icon, setIcon] = React.useState('');
    const [href, setHref] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [enabled, setEnabled] = React.useState(true);

    // Media Browser State
    const [browserOpen, setBrowserOpen] = React.useState(false);
    
    const isEditing = !!category;

    React.useEffect(() => {
        if (isOpen) {
            if (category) {
                setName(category.name);
                setIcon(category.icon);
                setHref(category.href);
                setImageUrl(category.imageUrl);
                setEnabled(category.enabled);
            } else {
                setName('');
                setIcon('Compass');
                setHref('/services/');
                setImageUrl('');
                setEnabled(true);
            }
        }
    }, [category, isOpen]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const id = category?.id || slugify(name);
        if (!id) {
            toast({ variant: 'destructive', title: 'Invalid ID', description: 'Category name cannot be empty.' });
            setIsSubmitting(false);
            return;
        }

        const dataToValidate: Category = {
            id,
            name,
            icon,
            href,
            imageUrl,
            enabled,
        };

        const parsed = categorySchema.safeParse(dataToValidate);

        if (!parsed.success) {
            toast({ variant: 'destructive', title: 'Invalid Data', description: parsed.error.errors.map(e => e.message).join('\n') });
            setIsSubmitting(false);
            return;
        }
        
        onSave(parsed.data);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the service category.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <ScrollArea className="h-[60vh] p-1">
                            <div className="space-y-4 p-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Luxury Villas" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon Name</Label>
                                    <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} required placeholder="e.g., travel_explore" />
                                    <p className="text-xs text-muted-foreground">
                                        Use an icon name from{' '}
                                        <a href="https://fonts.google.com/icons?selected=Material+Symbols+Outlined" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                                            Google Fonts Icons
                                        </a>{' '}
                                        (e.g., "flight" or "beach_access") or use one of the built-in icons: {ICON_NAMES.join(', ')}.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="href">URL Path (href)</Label>
                                    <Input id="href" value={href} onChange={e => setHref(e.target.value)} required placeholder="/services/villas" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Slideshow Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input id="imageUrl" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
                                        <Button type="button" variant="outline" onClick={() => setBrowserOpen(true)}><ImageIcon className="mr-2 h-4 w-4" /> Browse</Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enabled" className="text-base">Category Enabled</Label>
                                        <p className="text-sm text-muted-foreground">
                                            If disabled, this category will be hidden from the app.
                                        </p>
                                    </div>
                                    <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="mt-4">
                            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Category
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <MediaBrowserDialog
                isOpen={browserOpen}
                onClose={() => setBrowserOpen(false)}
                onSelect={(url) => setImageUrl(url)}
            />
        </>
    );
};
