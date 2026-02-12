
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { addAdmin, removeAdmin, setSuperAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, Crown, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '../ui/skeleton';

function SubmitButton({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'destructive' | 'secondary' }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" variant={variant} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        </Button>
    );
}

function AddAdminForm() {
    const router = useRouter();
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [state, formAction] = React.useActionState(addAdmin, { error: null, success: false });

    React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Admin Added', description: 'The new admin has been successfully added.' });
            formRef.current?.reset();
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <form ref={formRef} action={formAction} className="space-y-4 rounded-md border p-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="login">Login Email</Label>
                    <Input id="login" name="login" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
            </div>
            <div className="flex justify-end">
                <SubmitButton>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Admin
                </SubmitButton>
            </div>
        </form>
    );
}

function RemoveAdminForm({ adminId }: { adminId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(removeAdmin, { error: null, success: false });
     React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Admin Removed' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={adminId} />
            <SubmitButton variant="destructive">
                <Trash2 className="h-4 w-4" />
            </SubmitButton>
        </form>
    );
}

function SetSuperAdminForm({ adminId }: { adminId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [state, formAction] = React.useActionState(setSuperAdmin, { error: null, success: false });

     React.useEffect(() => {
        if (state.success) {
            toast({ title: 'Super Admin Updated' });
            router.refresh();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

     return (
        <form action={formAction}>
            <input type="hidden" name="id" value={adminId} />
            <SubmitButton variant="secondary">
                <Crown className="h-4 w-4" />
            </SubmitButton>
        </form>
    );
}

function AdminTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}


export default function AdminManagement({ admins, currentUser, isLoading }: { admins: any[], currentUser: any, isLoading: boolean }) {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Administrators</CardTitle>
                <CardDescription>Add, remove, or promote administrators.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <AdminTableSkeleton /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell className="capitalize">{admin.role}</TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        {admin.id !== currentUser.id && admin.role !== 'superadmin' && (
                                            <SetSuperAdminForm adminId={admin.id} />
                                        )}
                                        {admin.id !== currentUser.id && (
                                            <RemoveAdminForm adminId={admin.id} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen} className="mt-6">
                    <CollapsibleTrigger asChild>
                         <div className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <p className="font-semibold text-sm">Add New Admin</p>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronsUpDown className="h-4 w-4" />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                        <AddAdminForm />
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
