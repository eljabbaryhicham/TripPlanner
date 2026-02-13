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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
    return (
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
        </Button>
    );
}

function AdminTemplateForm({ currentTemplate }: { currentTemplate: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const template = formData.get('template') as string;

        if (!firestore) {
            toast({ variant: "destructive", title: "Error", description: "Database not available." });
            setIsSubmitting(false);
            return;
        }
        
        const templateRef = doc(firestore, 'email_templates', 'admin_notification');
        setDocumentNonBlocking(templateRef, { template }, { merge: true });
        toast({ title: "Admin template update initiated." });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea name="template" defaultValue={currentTemplate} rows={15} className="font-mono text-xs" />
            <div className="flex justify-end"><SubmitButton isSubmitting={isSubmitting} /></div>
        </form>
    );
}

function ClientTemplateForm({ currentTemplate }: { currentTemplate: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const template = formData.get('template') as string;

        if (!firestore) {
            toast({ variant: "destructive", title: "Error", description: "Database not available." });
            setIsSubmitting(false);
            return;
        }

        const templateRef = doc(firestore, 'email_templates', 'client_confirmation');
        setDocumentNonBlocking(templateRef, { template }, { merge: true });
        toast({ title: "Client template update initiated." });
        setIsSubmitting(false);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea name="template" defaultValue={currentTemplate} rows={15} className="font-mono text-xs" />
            <div className="flex justify-end"><SubmitButton isSubmitting={isSubmitting} /></div>
        </form>
    );
}

interface EmailTemplatesManagementProps {
    currentAdminTemplate: string;
    currentClientTemplate: string;
}

export default function EmailTemplatesManagement({ currentAdminTemplate, currentClientTemplate }: EmailTemplatesManagementProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                    Customize the HTML for emails sent for booking inquiries. Use placeholders like {"{{name}}"}, {"{{serviceName}}"}, etc.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="admin">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="admin">Admin Notification</TabsTrigger>
                        <TabsTrigger value="client">Client Confirmation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="admin" className="mt-4">
                        <AdminTemplateForm currentTemplate={currentAdminTemplate} />
                    </TabsContent>
                    <TabsContent value="client" className="mt-4">
                        <ClientTemplateForm currentTemplate={currentClientTemplate} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
