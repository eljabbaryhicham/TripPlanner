'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import DashboardContent from '@/components/admin/dashboard-content';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    // This effect handles the redirection for non-authenticated or anonymous users.
    React.useEffect(() => {
        if (!isUserLoading && (!user || user.isAnonymous)) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Check for admin status only if a non-anonymous user exists.
    const adminProfileRef = useMemoFirebase(() => (user && !user.isAnonymous && firestore) ? doc(firestore, 'roles_admin', user.uid) : null, [user, firestore]);
    const { data: adminProfile, isLoading: isAdminProfileLoading } = useDoc(adminProfileRef);
    const isAdmin = !!adminProfile;

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };
    
    const grantAdminAccess = () => {
        if (!user || user.isAnonymous || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'A valid user or database is not available.' });
            return;
        }

        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        const dataToSave = { email: user.email, createdAt: serverTimestamp(), role: 'admin', id: user.uid };

        // Optimistically show the toast
        toast({ title: "Success!", description: "Admin access granted. Welcome. To manage other users, ask a superadmin to promote your account." });
        
        // Perform the non-blocking write. If it fails, the FirebaseErrorListener will catch it.
        setDocumentNonBlocking(adminDocRef, dataToSave, {});
    };

    // Consolidate loading states: true if user is loading, OR if we have a non-anonymous user and are checking their admin profile.
    const isLoading = isUserLoading || (user && !user.isAnonymous && isAdminProfileLoading);

    // Primary loading state for the entire page.
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    // After loading, if there's no user or user is anonymous, we are in the process of redirecting.
    // Showing a spinner here prevents any content flash while router.push works.
    if (!user || user.isAnonymous) {
        return (
             <div className="flex min-h-screen items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If user is authenticated but not an admin, show the grant access card.
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

    // If user is authenticated and is an admin, show the dashboard.
    return (
        <div className="min-h-screen bg-muted/40">
            <DashboardContent />
        </div>
    );
}
