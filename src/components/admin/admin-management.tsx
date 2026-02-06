'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { addAdmin, removeAdmin, setSuperAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'destructive' | 'secondary' }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" variant={variant} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        </Button>
    );
}

function AddAdminForm() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(addAdmin, { error: null, success: false });

    useEffect(() => {
        if (state.success) {
            toast({ title: 'Admin Added', description: 'The new admin has been successfully added.' });
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="login">Login</Label>
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
    const { toast } = useToast();
    const [state, formAction] = useActionState(removeAdmin, { error: null, success: false });
     useEffect(() => {
        if (state.success) {
            toast({ title: 'Admin Removed' });
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

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
     const { toast } = useToast();
    const [state, formAction] = useActionState(setSuperAdmin, { error: null, success: false });

     useEffect(() => {
        if (state.success) {
            toast({ title: 'Super Admin Updated' });
        }
        if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);

     return (
        <form action={formAction}>
            <input type="hidden" name="id" value={adminId} />
            <SubmitButton variant="secondary">
                <Crown className="h-4 w-4" />
            </SubmitButton>
        </form>
    );
}


export default function AdminManagement({ admins, currentUser }: { admins: any[], currentUser: any }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Administrators</CardTitle>
                    <CardDescription>Add, remove, or promote administrators.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Login</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>{admin.login}</TableCell>
                                    <TableCell>{admin.role}</TableCell>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Admin</CardTitle>
                    <CardDescription>Create a new administrator account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddAdminForm />
                </CardContent>
            </Card>
        </div>
    );
}
