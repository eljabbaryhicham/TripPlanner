'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle, Trash2, Crown, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '../ui/skeleton';

import { useFirestore, useAuth, updateDocumentNonBlocking } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import { FirebaseApp, initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


function AddAdminForm() {
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
            // Use a unique name for the app instance to avoid conflicts on fast re-renders
            secondaryApp = initializeApp(firebaseConfig, `admin-creation-app-${Date.now()}`);
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

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
        } catch (error: any) {
            let errorMessage = 'An unknown error occurred.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use. If this user was a previous admin, their account must be fully deleted before they can be re-added.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password must be at least 6 characters long.';
            } else if (error.code) {
                errorMessage = error.code;
            }
            toast({ variant: 'destructive', title: 'Error Adding Admin', description: errorMessage });
        } finally {
            setIsSubmitting(false);
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

function RemoveAdminButton({ adminId }: { adminId: string }) {
    const { toast } = useToast();
    const auth = useAuth();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleRemove = async () => {
        setIsDeleting(true);
        try {
            if (!auth.currentUser) {
                throw new Error("You must be logged in to perform this action.");
            }

            const token = await auth.currentUser.getIdToken();

            const response = await fetch('/api/delete-admin-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ uidToDelete: adminId })
            });
            
            const result = await response.json();

            if (!response.ok) {
                // Prioritize the detailed message from the server
                const errorMessage = result.details || result.error || 'An unknown error occurred on the server.';
                throw new Error(errorMessage);
            }

            toast({ title: 'Admin Deleted', description: 'The admin user and their authentication account have been removed.' });
        } catch (error: any) {
             toast({ 
                variant: 'destructive', 
                title: 'Deletion Failed', 
                description: error.message,
                duration: 10000 // Give more time to read the error
             });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button size="sm" variant="destructive" disabled={isDeleting} onClick={handleRemove}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}

function SetSuperAdminButton({ adminId }: { adminId: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPromoting, setIsPromoting] = React.useState(false);

    const handlePromote = () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }
        setIsPromoting(true);

        const docRef = doc(firestore, 'roles_admin', adminId);
        updateDocumentNonBlocking(docRef, { role: 'superadmin' });
        
        toast({ title: 'Super Admin Updated', description: 'Admin has been promoted.' });
        setIsPromoting(false);
    };
    
    return (
        <Button size="sm" variant="secondary" disabled={isPromoting} onClick={handlePromote}>
            {isPromoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
        </Button>
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
                <CardDescription>
                    Add, remove, or promote administrators. These actions are performed by your browser, authorized by your Super Admin role.
                </CardDescription>
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
                                            <SetSuperAdminButton adminId={admin.id} />
                                        )}
                                        {admin.id !== currentUser.id && (
                                            <RemoveAdminButton adminId={admin.id} />
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
