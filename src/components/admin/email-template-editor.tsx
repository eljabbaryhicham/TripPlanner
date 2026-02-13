'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
    return (
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
        </Button>
    );
}

export default function EmailTemplateEditor({ currentTemplate }: { currentTemplate: string }) {
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
        const template = formData.get('template') as string;

        const templateRef = doc(firestore, 'email_templates', 'admin_notification');
        setDocumentNonBlocking(templateRef, { template }, { merge: true });

        toast({ title: 'Admin template update initiated.' });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Notification Email Template</CardTitle>
                <CardDescription>
                    Customize the HTML for the booking inquiry email sent to the admin. Use placeholders like {"{{name}}"}, {"{{email}}"}, {"{{serviceName}}"}, etc.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        name="template"
                        defaultValue={currentTemplate}
                        rows={15}
                        className="font-mono text-xs"
                    />
                    <div className="flex justify-end">
                        <SubmitButton isSubmitting={isSubmitting} />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
