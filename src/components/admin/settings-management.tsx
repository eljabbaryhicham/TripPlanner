
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateGeneralSettings } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';
import { MediaBrowserDialog } from './media-browser-dialog';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
    );
}

interface SettingsManagementProps {
    currentWhatsappNumber: string;
    currentBookingEmailTo: string;
    currentResendEmailFrom: string;
    currentLogoUrl?: string;
    currentHeroBackgroundImageUrl?: string;
    currentSuggestionsBackgroundImageUrl?: string;
    currentCategoryImages?: {
        cars: string;
        hotels: string;
        transport: string;
        explore: string;
    };
}

export default function SettingsManagement({
    currentWhatsappNumber,
    currentBookingEmailTo,
    currentResendEmailFrom,
    currentLogoUrl,
    currentHeroBackgroundImageUrl,
    currentSuggestionsBackgroundImageUrl,
    currentCategoryImages
}: SettingsManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateGeneralSettings, { error: null, success: false });

    const [logoUrl, setLogoUrl] = React.useState(currentLogoUrl || '');
    const [heroBg, setHeroBg] = React.useState(currentHeroBackgroundImageUrl || '');
    const [suggestionsBg, setSuggestionsBg] = React.useState(currentSuggestionsBackgroundImageUrl || '');
    const [categoryImages, setCategoryImages] = React.useState({
        cars: currentCategoryImages?.cars || '',
        hotels: currentCategoryImages?.hotels || '',
        transport: currentCategoryImages?.transport || '',
        explore: currentCategoryImages?.explore || '',
    });

    const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);
    const [imageTarget, setImageTarget] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Settings Updated', description: 'Your changes have been saved successfully.' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    const handleSelectImage = (url: string) => {
        if (imageTarget === 'logoUrl') setLogoUrl(url);
        else if (imageTarget === 'heroBg') setHeroBg(url);
        else if (imageTarget === 'suggestionsBg') setSuggestionsBg(url);
        else if (imageTarget && imageTarget.startsWith('category.')) {
            const category = imageTarget.split('.')[1] as keyof typeof categoryImages;
            setCategoryImages(prev => ({ ...prev, [category]: url }));
        }
        setIsBrowserOpen(false);
        setImageTarget(null);
    };

    const openBrowser = (target: string) => {
        setImageTarget(target);
        setIsBrowserOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage application-wide settings for visuals, notifications, and contact points.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6 max-w-2xl">
                        <div className="space-y-2">
                            <Label htmlFor="logoUrl">Website Logo URL</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="logoUrl"
                                    name="logoUrl"
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                />
                                <Button type="button" variant="outline" onClick={() => openBrowser('logoUrl')}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Browse
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">This logo appears in the header. Leave blank for the default icon.</p>
                        </div>
                        <Separator />
                        <h4 className="text-lg font-semibold pt-4">Homepage Visuals</h4>
                        <p className="text-sm text-muted-foreground -mt-4">Customize backgrounds for homepage sections and images for the category slideshow.</p>

                        <div className="space-y-2">
                            <Label htmlFor="heroBackgroundImageUrl">Hero Section Background</Label>
                            <div className="flex items-center gap-2">
                                <Input id="heroBackgroundImageUrl" name="heroBackgroundImageUrl" type="url" placeholder="URL for hero background" value={heroBg} onChange={(e) => setHeroBg(e.target.value)} />
                                <Button type="button" variant="outline" onClick={() => openBrowser('heroBg')}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Browse
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="suggestionsBackgroundImageUrl">Suggestions Section Background</Label>
                            <div className="flex items-center gap-2">
                                <Input id="suggestionsBackgroundImageUrl" name="suggestionsBackgroundImageUrl" type="url" placeholder="URL for suggestions background" value={suggestionsBg} onChange={(e) => setSuggestionsBg(e.target.value)} />
                                <Button type="button" variant="outline" onClick={() => openBrowser('suggestionsBg')}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Browse
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="categoryImages.cars">Cars Slideshow Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="categoryImages.cars" name="categoryImages.cars" type="url" value={categoryImages.cars} onChange={(e) => setCategoryImages(p => ({...p, cars: e.target.value}))} />
                                    <Button type="button" variant="outline" size="icon" onClick={() => openBrowser('category.cars')}><ImageIcon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="categoryImages.hotels">Hotels Slideshow Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="categoryImages.hotels" name="categoryImages.hotels" type="url" value={categoryImages.hotels} onChange={(e) => setCategoryImages(p => ({...p, hotels: e.target.value}))} />
                                    <Button type="button" variant="outline" size="icon" onClick={() => openBrowser('category.hotels')}><ImageIcon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="categoryImages.transport">Transport Slideshow Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="categoryImages.transport" name="categoryImages.transport" type="url" value={categoryImages.transport} onChange={(e) => setCategoryImages(p => ({...p, transport: e.target.value}))} />
                                    <Button type="button" variant="outline" size="icon" onClick={() => openBrowser('category.transport')}><ImageIcon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="categoryImages.explore">Explore Slideshow Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="categoryImages.explore" name="categoryImages.explore" type="url" value={categoryImages.explore} onChange={(e) => setCategoryImages(p => ({...p, explore: e.target.value}))} />
                                    <Button type="button" variant="outline" size="icon" onClick={() => openBrowser('category.explore')}><ImageIcon className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        <h4 className="text-lg font-semibold pt-4">Contact & Notifications</h4>
                        <p className="text-sm text-muted-foreground -mt-4">Manage WhatsApp number and email addresses for bookings and contact forms.</p>

                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                            <Input
                                id="whatsappNumber"
                                name="whatsappNumber"
                                defaultValue={currentWhatsappNumber}
                                placeholder="e.g., +15551234567"
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="bookingEmailTo">Booking Notification Email</Label>
                            <Input
                                id="bookingEmailTo"
                                name="bookingEmailTo"
                                type="email"
                                defaultValue={currentBookingEmailTo}
                                placeholder="recipient@example.com"
                                required
                            />
                            <p className="text-xs text-muted-foreground">The email address that receives all booking and contact form inquiries.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="resendEmailFrom">"From" Email Address (Resend)</Label>
                            <Input
                                id="resendEmailFrom"
                                name="resendEmailFrom"
                                type="text"
                                defaultValue={currentResendEmailFrom}
                                placeholder="My App <noreply@mydomain.com>"
                                required
                            />
                            <p className="text-xs text-muted-foreground">The "From" address for emails sent via Resend. Must be a verified domain.</p>
                        </div>
                        <div className="flex justify-end pt-2">
                            <SubmitButton />
                        </div>
                    </form>
                </CardContent>
            </Card>
            <MediaBrowserDialog 
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleSelectImage}
            />
        </>
    );
}
