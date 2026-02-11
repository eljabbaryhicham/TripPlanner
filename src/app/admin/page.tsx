'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useAuth, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import DashboardContent from '@/components/admin/dashboard-content';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    // Check for admin status
    const adminProfileRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'roles_admin', user.uid) : null, [user, firestore]);
    const { data: adminProfile, isLoading: isAdminProfileLoading } = useDoc(adminProfileRef);
    const isAdmin = !!adminProfile;

    // Redirect if not logged in
    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };
    
    const grantAdminAccess = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'User or database not available.' });
            return;
        }

        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        // Self-signup always results in 'admin' role. Promotion to 'superadmin' must be done by an existing superadmin.
        const dataToSave = { email: user.email, createdAt: serverTimestamp(), role: 'admin', id: user.uid };

        try {
            await setDoc(adminDocRef, dataToSave);
            toast({ title: "Success!", description: "Admin access granted. Welcome to the dashboard. To manage users, ask a superadmin to promote your account." });
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: adminDocRef.path,
                operation: 'create',
                requestResourceData: dataToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Grant Access Failed', description: 'A permission error occurred. Please check security rules.' });
        }
    };

    const isLoading = isUserLoading || isAdminProfileLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) { // Should be handled by useEffect redirect, but as a fallback
        return (
             <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="mx-auto w-full max-w-lg text-center">
                    <CardHeader>
                        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                        <CardTitle>Admin Access Required</CardTitle>
                        <CardDescription>
                            This dashboard is protected. To access it, you need to grant yourself administrative privileges. This is a one-time action for the first administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={grantAdminAccess}>Grant Admin Access</Button>
                        <Button variant="ghost" onClick={handleLogout}>Logout</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <DashboardContent />
        </div>
    );
}
