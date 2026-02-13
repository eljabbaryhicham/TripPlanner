'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
    return (
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData);
        const categoryStates = {
            cars: data.cars === 'on',
            hotels: data.hotels === 'on',
            transport: data.transport === 'on',
            explore: data.explore === 'on',
        };

        const settingsRef = doc(firestore, 'app_settings', 'general');
        setDocumentNonBlocking(settingsRef, { categories: categoryStates }, { merge: true });

        toast({ title: 'Category settings update initiated.' });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                    Enable or disable entire service categories across the app. This will hide them from the navigation and service pages.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <CategoryToggle id="cars" label="Car Rentals" defaultChecked={currentSettings?.cars ?? true} />
                    <Separator />
                    <CategoryToggle id="hotels" label="Hotels" defaultChecked={currentSettings?.hotels ?? true} />
                    <Separator />
                    <CategoryToggle id="transport" label="Transport / Pickup" defaultChecked={currentSettings?.transport ?? true} />
                    <Separator />
                    <CategoryToggle id="explore" label="Explore Trips" defaultChecked={currentSettings?.explore ?? true} />
                    <div className="flex justify-end pt-4">
                        <SubmitButton isSubmitting={isSubmitting} />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
