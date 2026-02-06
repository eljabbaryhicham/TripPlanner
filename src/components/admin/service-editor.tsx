'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveService } from '@/lib/actions';
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

interface ServiceEditorProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditing ? 'Save Changes' : 'Create Service'}
        </Button>
    );
}

export function ServiceEditor({ isOpen, onClose, service }: ServiceEditorProps) {
    const { toast } = useToast();
    const isEditing = !!service;
    const [state, formAction] = useActionState(saveService, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: isEditing ? 'Service Updated' : 'Service Created', description: 'Your changes have been saved successfully.' });
            onClose();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, isEditing, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction}>
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
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <SubmitButton isEditing={isEditing} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
