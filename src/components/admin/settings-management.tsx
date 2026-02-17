'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';
import { MediaBrowserDialog } from './media-browser-dialog';
import { useSettings } from '../settings-provider';

const generalSettingsSchema = z.object({
    whatsappNumber: z.string().min(1, { message: 'WhatsApp number cannot be empty.' }),
    bookingEmailTo: z.string().email({ message: 'A valid recipient email is required.' }),
    resendEmailFrom: z.string().min(1, { message: 'A "from" email is required for Resend.' }),
    logoUrl: z.string().url({ message: "Invalid URL" }).or(z.literal("")).optional(),
    heroBackgroundImageUrl: z.string().url({ message: "Invalid URL for Hero Background" }).or(z.literal("")).optional(),
    suggestionsBackgroundImageUrl: z.string().url({ message: "Invalid URL for Suggestions Background" }).or(z.literal("")).optional(),
});

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
    return (
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
    );
}

export default function SettingsManagement() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const settings = useSettings();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [logoUrl, setLogoUrl] = React.useState(settings.logoUrl || '');
    const [heroBg, setHeroBg] = React.useState(settings.heroBackgroundImageUrl || '');
    const [suggestionsBg, setSuggestionsBg] = React.useState(settings.suggestionsBackgroundImageUrl || '');

    const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);
    const [imageTarget, setImageTarget] = React.useState<string | null>(null);

    const handleSelectImage = (url: string) => {
        if (imageTarget === 'logoUrl') setLogoUrl(url);
        else if (imageTarget === 'heroBg') setHeroBg(url);
        else if (imageTarget === 'suggestionsBg') setSuggestionsBg(url);
        setIsBrowserOpen(false);
        setImageTarget(null);
    };

    const openBrowser = (target: string) => {
        setImageTarget(target);
        setIsBrowserOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const rawData = Object.fromEntries(formData);
        const parsed = generalSettingsSchema.safeParse(rawData);

        if (!parsed.success) {
            toast({ variant: 'destructive', title: 'Invalid Data', description: parsed.error.errors[0].message });
            setIsSubmitting(false);
            return;
        }

        const settingsRef = doc(firestore, 'app_settings', 'general');
        setDocumentNonBlocking(settingsRef, parsed.data, { merge: true });

        toast({ title: 'Settings update initiated.', description: 'Your changes have been saved.' });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage application-wide settings for visuals, notifications, and contact points.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
                        <p className="text-sm text-muted-foreground -mt-4">Customize backgrounds for homepage sections.</p>

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

                        <Separator />
                        <h4 className="text-lg font-semibold pt-4">Contact & Notifications</h4>
                        <p className="text-sm text-muted-foreground -mt-4">Manage WhatsApp number and email addresses for bookings and contact forms.</p>

                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                            <Input
                                id="whatsappNumber"
                                name="whatsappNumber"
                                defaultValue={settings.whatsappNumber}
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
                                defaultValue={settings.bookingEmailTo}
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
                                defaultValue={settings.resendEmailFrom}
                                placeholder="My App <noreply@mydomain.com>"
                                required
                            />
                            <p className="text-xs text-muted-foreground">The "From" address for emails sent via Resend. Must be a verified domain.</p>
                        </div>
                        <div className="flex justify-end pt-2">
                            <SubmitButton isSubmitting={isSubmitting} />
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