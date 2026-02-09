'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateEmailTemplate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
        </Button>
    );
}

export default function EmailTemplateEditor({ currentTemplate }: { currentTemplate: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(updateEmailTemplate, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Template Updated', description: 'The email template has been saved.' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Template Editor</CardTitle>
                <CardDescription>
                    Customize the HTML for booking inquiry emails. Use placeholders like {"{{name}}"}, {"{{email}}"}, {"{{serviceName}}"}, {"{{phone}}"}, {"{{dates}}"}, and {"{{message}}"}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <Textarea
                        name="template"
                        defaultValue={currentTemplate}
                        rows={15}
                        className="font-mono text-xs"
                    />
                    <div className="flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
