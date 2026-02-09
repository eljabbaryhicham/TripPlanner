'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ServiceEditorProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
}

const additionalMediaSchema = z.object({
  imageUrl: z.string().url('Media item must have a valid URL.'),
  imageHint: z.string().min(1, 'Media item must have an image hint.'),
  description: z.string().min(1, 'Media item must have a description.'),
});

const serviceSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Image URL must be a valid URL'),
    imageHint: z.string().min(1, 'Image hint is required'),
    category: z.enum(['cars', 'hotels', 'transport']),
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    priceUnit: z.enum(['day', 'night', 'trip']),
    location: z.string().min(1, 'Location is required'),
    isBestOffer: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(false),
    details: z.string().transform((str, ctx) => {
        try {
            const parsed = JSON.parse(str);
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Details must be a valid JSON object.' });
                return z.NEVER;
            }
            for (const key in parsed) {
                if (typeof parsed[key] !== 'string') {
                     ctx.addIssue({ code: z.ZodIssueCode.custom, message: `In Details, the value for "${key}" must be a string.` });
                     return z.NEVER;
                }
            }
            return parsed;
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Details must be valid JSON.' });
            return z.NEVER;
        }
    }),
    additionalMedia: z.string().transform((str, ctx) => {
        try {
            if (!str || str.trim() === '') return []; // Allow empty string
            const parsed = JSON.parse(str);
            const arraySchema = z.array(additionalMediaSchema);
            const result = arraySchema.safeParse(parsed);
            if (!result.success) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Additional Media is not a valid array of media objects. Check URLs and ensure all fields are present.' });
                return z.NEVER;
            }
            return result.data;
        } catch (e) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Additional Media must be a valid JSON array.' });
            return z.NEVER;
        }
    })
});

export function ServiceEditor({ isOpen, onClose, service }: ServiceEditorProps) {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const isEditing = !!service;
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData);
        const parsed = serviceSchema.safeParse(data);

        if (!parsed.success) {
            toast({ variant: 'destructive', title: 'Invalid Data', description: parsed.error.errors.map(e => e.message).join('\n') });
            setIsSubmitting(false);
            return;
        }
        
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            setIsSubmitting(false);
            return;
        }

        const { id, category, ...serviceData } = parsed.data;
        const docId = id || `${category}-${Date.now()}`;
        
        let collectionPath: string;
        switch(category) {
            case 'cars': collectionPath = 'carRentals'; break;
            case 'hotels': collectionPath = 'hotels'; break;
            case 'transport': collectionPath = 'transports'; break;
            default:
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
                setIsSubmitting(false);
                return;
        }

        const docRef = doc(firestore, collectionPath, docId);
        const dataToSave = { ...serviceData, id: docId };

        setDoc(docRef, dataToSave, { merge: true })
            .then(() => {
                toast({ title: isEditing ? 'Service Updated' : 'Service Created', description: 'Your changes have been saved successfully.' });
                onClose();
                // No router.refresh needed because useCollection provides live data
            })
            .catch((error) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: isEditing ? 'update' : 'create',
                    requestResourceData: dataToSave,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Save Failed', description: 'You may not have the required permissions to save this service.' });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit}>
                    {isEditing && <input type="hidden" name="id" value={service.id} />}
                    <ScrollArea className="h-[60vh] p-1">
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" defaultValue={service?.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" defaultValue={service?.description} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">Main Image URL</Label>
                                    <Input id="imageUrl" name="imageUrl" type="url" defaultValue={service?.imageUrl} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imageHint">Image Hint</Label>
                                    <Input id="imageHint" name="imageHint" defaultValue={service?.imageHint} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category" defaultValue={service?.category}>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cars">Cars</SelectItem>
                                            <SelectItem value="hotels">Hotels</SelectItem>
                                            <SelectItem value="transport">Transport</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" defaultValue={service?.location} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input id="price" name="price" type="number" step="0.01" defaultValue={service?.price} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priceUnit">Price Unit</Label>
                                     <Select name="priceUnit" defaultValue={service?.priceUnit}>
                                        <SelectTrigger id="priceUnit">
                                            <SelectValue placeholder="Select a unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="day">per day</SelectItem>
                                            <SelectItem value="night">per night</SelectItem>
                                            <SelectItem value="trip">per trip</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="details">Details (JSON Format)</Label>
                                <Textarea id="details" name="details" rows={5} defaultValue={JSON.stringify(service?.details || {}, null, 2)} required />
                                <p className="text-xs text-muted-foreground">Provide service details as a JSON object.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="additionalMedia">Additional Media (JSON Array)</Label>
                                <Textarea id="additionalMedia" name="additionalMedia" rows={5} defaultValue={JSON.stringify(service?.additionalMedia || [], null, 2)} />
                                <p className="text-xs text-muted-foreground">Provide an array of objects: {`[{ "imageUrl": "...", "imageHint": "...", "description": "..." }]`}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="isBestOffer" name="isBestOffer" defaultChecked={service?.isBestOffer} />
                                <Label htmlFor="isBestOffer">Mark as Best Offer</Label>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Save Changes' : 'Create Service'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}