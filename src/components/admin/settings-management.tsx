
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
}

export default function SettingsManagement({ currentWhatsappNumber, currentBookingEmailTo, currentResendEmailFrom, currentLogoUrl }: SettingsManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateGeneralSettings, { error: null, success: false });
    
    const [logoUrl, setLogoUrl] = React.useState(currentLogoUrl || '');
    const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);

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
        setLogoUrl(url);
        setIsBrowserOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage application-wide settings for the logo, notifications, and contact points.</CardDescription>
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
                                <Button type="button" variant="outline" onClick={() => setIsBrowserOpen(true)}>
                                    <ImageIcon className="mr-2 h-4 w-4" /> Browse
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">This logo appears in the header. Leave blank for the default icon.</p>
                        </div>
                        <Separator />
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
                        <Separator />
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
                        <Separator />
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
