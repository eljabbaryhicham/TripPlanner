'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { updateWhatsappNumber } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
    );
}

export default function SettingsManagement({ currentWhatsappNumber }: { currentWhatsappNumber: string }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateWhatsappNumber, { error: null, success: false });

    useEffect(() => {
        if (state.success) {
            toast({ title: 'Settings Updated', description: 'Your changes have been saved successfully.' });
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-4 max-w-md">
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
            <div className="flex justify-end">
                <SubmitButton />
            </div>
        </form>
    );
}
