'use client';

import * as React from 'react';
import type { Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useImperativeHandle, forwardRef } from 'react';

export interface ServiceEditorHandles {
    edit: (service: Service) => void;
    add: () => void;
}

const additionalMediaSchema = z.object({
  imageUrl: z.string().url({ message: 'Media item must have a valid URL.' }),
  description: z.string().min(1, { message: 'Media item must have a description.' }),
});

const serviceSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    imageUrl: z.string().url('Image URL must be a valid URL'),
    category: z.enum(['cars', 'hotels', 'transport']),
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    priceUnit: z.enum(['day', 'night', 'trip']),
    location: z.string().min(1, 'Location is required'),
    isBestOffer: z.boolean().default(false),
    isActive: z.boolean().default(true),
    details: z.record(z.string()),
    additionalMedia: z.array(additionalMediaSchema)
});

type Detail = { id: number; key: string; value: string };
type Media = { id: number; imageUrl: string; description: string };

const detailOptions = {
    cars: {
        'Transmission': ['Automatic', 'Manual'],
        'Fuel Policy': ['Full to full', 'Full to empty', 'Pay for what you use'],
    },
    hotels: {
        'Room Type': ['Standard Queen', 'Deluxe King', 'Twin Room', 'Suite', 'Dormitory Bed'],
    },
    transport: {
        'Service': ['Personal meet & greet', 'Shuttle Service', 'Private Transfer'],
        'Vehicle': ['Comfortable Sedan', 'Minivan', 'Luxury Car', 'Shuttle Bus'],
    }
};

const detailKeySuggestions = {
    cars: ['Seats', 'Transmission', 'Fuel Policy'],
    hotels: ['Amenities', 'Room Type'],
    transport: ['Service', 'Includes', 'Vehicle']
};

const ServiceEditor = forwardRef<ServiceEditorHandles, {}>((props, ref) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Internal state for the dialog
    const [isOpen, setIsOpen] = React.useState(false);
    const [service, setService] = React.useState<Service | null>(null);

    // Form state - initialized to empty/default values
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [imageUrl, setImageUrl] = React.useState('');
    const [category, setCategory] = React.useState<'cars' | 'hotels' | 'transport'>('cars');
    const [location, setLocation] = React.useState('');
    const [price, setPrice] = React.useState<number | string>('');
    const [priceUnit, setPriceUnit] = React.useState<'day' | 'night' | 'trip'>('day');
    const [isBestOffer, setIsBestOffer] = React.useState(false);
    const [isActive, setIsActive] = React.useState(true);
    const [details, setDetails] = React.useState<Detail[]>([]);
    const [additionalMedia, setAdditionalMedia] = React.useState<Media[]>([]);

    const isEditing = !!service?.id;

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        edit: (serviceToEdit: Service) => {
            setService(serviceToEdit);
            setIsOpen(true);
        },
        add: () => {
            setService(null);
            setIsOpen(true);
        }
    }));

    // Effect to populate form state when the dialog is opened or the service changes
    React.useEffect(() => {
        if (isOpen) {
            setName(service?.name || '');
            setDescription(service?.description || '');
            setImageUrl(service?.imageUrl || '');
            setCategory(service?.category || 'cars');
            setLocation(service?.location || '');
            setPrice(service?.price ?? '');
            setPriceUnit(service?.priceUnit || (service?.category === 'hotels' ? 'night' : service?.category === 'transport' ? 'trip' : 'day'));
            setIsBestOffer(service?.isBestOffer || false);
            setIsActive(service?.isActive ?? true);
            
            const initialDetails = service?.details
                ? Object.entries(service.details).map(([key, value], i) => ({ id: Date.now() + i, key, value }))
                : [];
            setDetails(initialDetails);

            if (!service?.id) { // If it's a new service
                const currentCategory = service?.category || 'cars';
                let defaultDetails: { key: string; value: string }[] = [];
                switch (currentCategory) {
                    case 'cars':
                        defaultDetails = [
                            { key: 'Seats', value: '' },
                            { key: 'Transmission', value: 'Automatic' },
                            { key: 'Fuel Policy', value: 'Full to full' },
                        ];
                        break;
                    case 'hotels':
                        defaultDetails = [
                            { key: 'Amenities', value: '' },
                            { key: 'Room Type', value: '' },
                        ];
                        break;
                    case 'transport':
                         defaultDetails = [
                            { key: 'Service', value: 'Personal meet & greet' },
                            { key: 'Includes', value: '' },
                            { key: 'Vehicle', value: 'Comfortable Sedan' },
                        ];
                        break;
                }
                setDetails(defaultDetails.map(d => ({ ...d, id: Date.now() + Math.random() })));
            }

            setAdditionalMedia(
                service?.additionalMedia
                    ? service.additionalMedia.map((m, i) => ({ ...m, id: Date.now() + i }))
                    : []
            );
        }
    }, [service, isOpen]);


    // Handlers for dynamic fields
    const handleDetailChange = (index: number, field: 'key' | 'value', value: string) => {
        const newDetails = [...details];
        newDetails[index][field] = value;
        setDetails(newDetails);
    };
    const addDetail = (key: string = '') => setDetails([...details, { id: Date.now(), key, value: '' }]);
    const removeDetail = (id: number) => setDetails(details.filter(d => d.id !== id));

    const handleMediaChange = (index: number, field: keyof Omit<Media, 'id'>, value: string) => {
        const newMedia = [...additionalMedia];
        newMedia[index][field] = value;
        setAdditionalMedia(newMedia);
    };
    const addMedia = () => setAdditionalMedia([...additionalMedia, { id: Date.now(), imageUrl: '', description: '' }]);
    const removeMedia = (id: number) => setAdditionalMedia(additionalMedia.filter(m => m.id !== id));

    const handleClose = () => setIsOpen(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const detailsObject = details.reduce((acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const mediaArray = additionalMedia.map(({ imageUrl, description }) => ({ imageUrl, description }));

        const dataToValidate = {
            id: service?.id,
            name,
            description,
            imageUrl,
            category,
            price,
            priceUnit,
            location,
            isBestOffer,
            isActive,
            details: detailsObject,
            additionalMedia: mediaArray,
        };

        const parsed = serviceSchema.safeParse(dataToValidate);

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

        const { id, category: serviceCategory, ...serviceData } = parsed.data;
        const docId = id || `${serviceCategory}-${Date.now()}`;
        
        let collectionPath: string;
        switch(serviceCategory) {
            case 'cars': collectionPath = 'carRentals'; break;
            case 'hotels': collectionPath = 'hotels'; break;
            case 'transport': collectionPath = 'transports'; break;
            default:
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid service category.' });
                setIsSubmitting(false);
                return;
        }

        const docRef = doc(firestore, collectionPath, docId);
        const dataToSave = { ...serviceData, id: docId, category: serviceCategory };

        setDoc(docRef, dataToSave, { merge: true })
            .then(() => {
                toast({ title: isEditing ? 'Service Updated' : 'Service Created', description: 'Your changes have been saved successfully.' });
                handleClose();
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] p-1">
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Main Image URL</Label>
                                <Input id="imageUrl" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={(v: 'cars' | 'hotels' | 'transport') => setCategory(v)} disabled={isEditing}>
                                        <SelectTrigger>
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
                                    <Input id="location" value={location} onChange={e => setLocation(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Price Unit</Label>
                                     <Select value={priceUnit} onValueChange={(v: 'day' | 'night' | 'trip') => setPriceUnit(v)}>
                                        <SelectTrigger>
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
                            
                            <div className="space-y-2 rounded-md border p-4">
                                <Label>Service Details</Label>
                                <div className="space-y-2">
                                    {details.map((detail, index) => {
                                        const options = (detailOptions[category] as Record<string, string[] | undefined>)?.[detail.key];
                                        return (
                                        <div key={detail.id} className="flex items-center gap-2">
                                            <Input placeholder="Key (e.g., Seats)" value={detail.key} onChange={e => handleDetailChange(index, 'key', e.target.value)} />
                                            {options ? (
                                                <Select value={detail.value} onValueChange={(value) => handleDetailChange(index, 'value', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a value" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {options.map(option => (
                                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input placeholder="Value (e.g., 4)" value={detail.value} onChange={e => handleDetailChange(index, 'value', e.target.value)} />
                                            )}
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDetail(detail.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    )})}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />Add Detail</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {(detailKeySuggestions[category] || []).map(key => (
                                            <DropdownMenuItem key={key} onSelect={() => addDetail(key)}>
                                                Add '{key}'
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuItem onSelect={() => addDetail('')}>
                                            Add Custom Detail
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-2 rounded-md border p-4">
                                <Label>Additional Media (Optional)</Label>
                                <div className="space-y-3">
                                    {additionalMedia.map((media, index) => (
                                        <div key={media.id} className="space-y-2 border-t pt-3 relative">
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-0" onClick={() => removeMedia(media.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            <Input placeholder="Image URL" value={media.imageUrl} onChange={e => handleMediaChange(index, 'imageUrl', e.target.value)} />
                                            <Textarea placeholder="Short Description" value={media.description} onChange={e => handleMediaChange(index, 'description', e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addMedia}><PlusCircle className="mr-2 h-4 w-4" />Add Media</Button>
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch id="isBestOffer" checked={isBestOffer} onCheckedChange={setIsBestOffer} />
                                <Label htmlFor="isBestOffer">Mark as Best Offer</Label>
                            </div>
                             <div className="flex items-center space-x-2 pt-2">
                                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                                <Label htmlFor="isActive">Service is Active</Label>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Save Changes' : 'Create Service'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
});
ServiceEditor.displayName = 'ServiceEditor';

export { ServiceEditor };
