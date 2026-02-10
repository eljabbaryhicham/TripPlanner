'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateGeneralSettings } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '../ui/separator';

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
}

export default function SettingsManagement({ currentWhatsappNumber, currentBookingEmailTo }: SettingsManagementProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateGeneralSettings, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Settings Updated', description: 'Your changes have been saved successfully.' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage application-wide settings for notifications and contact points.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6 max-w-md">
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
                    <div className="flex justify-end pt-2">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
