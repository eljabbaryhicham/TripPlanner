'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateCategorySettings } from '@/lib/actions';
import { Separator } from '../ui/separator';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
        </Button>
    );
}

const CategoryToggle = ({ id, label, defaultChecked }: { id: string, label: string, defaultChecked: boolean }) => (
    <div className="flex items-center justify-between">
        <Label htmlFor={id} className="font-medium">
            {label}
        </Label>
        <Switch id={id} name={id} defaultChecked={defaultChecked} />
    </div>
);

export default function CategoryManagement({ currentSettings }: { currentSettings: { [key: string]: boolean } }) {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    
    // This hook is experimental and its API might change.
    // Using it to handle form state after submission.
    const [state, formAction] = React.useActionState(updateCategorySettings, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Categories Updated', description: 'Your category settings have been saved.' });
            // No need to call router.refresh() as revalidatePath is used in the server action.
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                    Enable or disable entire service categories across the app. This will hide them from the navigation and service pages.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={formAction} className="space-y-6">
                    <CategoryToggle id="cars" label="Car Rentals" defaultChecked={currentSettings?.cars ?? true} />
                    <Separator />
                    <CategoryToggle id="hotels" label="Hotels" defaultChecked={currentSettings?.hotels ?? true} />
                    <Separator />
                    <CategoryToggle id="transport" label="Transport / Pickup" defaultChecked={currentSettings?.transport ?? true} />
                    <Separator />
                    <CategoryToggle id="explore" label="Explore Trips" defaultChecked={currentSettings?.explore ?? true} />
                    <div className="flex justify-end pt-4">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
