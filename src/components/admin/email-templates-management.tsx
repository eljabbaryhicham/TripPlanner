'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateEmailTemplate, updateClientEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
        </Button>
    );
}

function AdminTemplateForm({ currentTemplate }: { currentTemplate: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateEmailTemplate, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Template Updated', description: 'The admin email template has been saved.' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <form action={formAction} className="space-y-4">
            <Textarea name="template" defaultValue={currentTemplate} rows={15} className="font-mono text-xs" />
            <div className="flex justify-end"><SubmitButton /></div>
        </form>
    );
}

function ClientTemplateForm({ currentTemplate }: { currentTemplate: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateClientEmailTemplate, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Template Updated', description: 'The client confirmation email template has been saved.' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <form action={formAction} className="space-y-4">
            <Textarea name="template" defaultValue={currentTemplate} rows={15} className="font-mono text-xs" />
            <div className="flex justify-end"><SubmitButton /></div>
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
