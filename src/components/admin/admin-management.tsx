
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { removeAdmin, setSuperAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, Crown, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '../ui/skeleton';

import { useFirestore } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import { FirebaseApp, initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


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
    const firestore = useFirestore();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email || !password) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please provide an email and password.' });
            return;
        }
        setIsSubmitting(true);

        let secondaryApp: FirebaseApp | null = null;
        try {
            // Initialize a secondary Firebase app to avoid logging out the current admin
            secondaryApp = initializeApp(firebaseConfig, 'admin-creation-app');
            const secondaryAuth = getAuth(secondaryApp);

            // Create the new user with the secondary auth instance
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            // Use the primary Firestore instance (where superadmin is logged in) to set the role
            const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
            await setDoc(adminRoleRef, {
                email: newUser.email,
                role: 'admin',
                createdAt: new Date(),
                id: newUser.uid,
            });

            toast({ title: 'Admin Added', description: 'The new admin has been successfully added.' });
            setEmail('');
            setPassword('');
            router.refresh();

        } catch (error: any) {
            let errorMessage = 'An unknown error occurred.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use by another account.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password must be at least 6 characters long.';
            } else if (error.code) {
                errorMessage = error.code;
            }
            toast({ variant: 'destructive', title: 'Error Adding Admin', description: errorMessage });
        } finally {
            setIsSubmitting(false);
            // Clean up the secondary app instance to prevent memory leaks
            if (secondaryApp) {
                try {
                    await deleteApp(secondaryApp);
                } catch (e) {
                    console.error("Error deleting secondary app:", e);
                }
            }
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="login">Login Email</Label>
                    <Input id="login" name="login" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add Admin
                </Button>
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
