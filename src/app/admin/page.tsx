'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import ServiceManagement from '@/components/admin/service-management';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
    
    // Auth check
    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Admin role check
    React.useEffect(() => {
        if (user && firestore) {
            const checkAdminRole = async () => {
                try {
                    const adminDocRef = doc(firestore, 'roles_admin', user.uid);
                    const adminDocSnap = await getDoc(adminDocRef);
                    setIsAdmin(adminDocSnap.exists());
                } catch (error: any) {
                    console.error("Admin role check failed:", error);
                    setIsAdmin(false);
                } finally {
                    setIsCheckingAdmin(false);
                }
            };
            checkAdminRole();
        } else if (!isUserLoading) {
            setIsCheckingAdmin(false);
        }
    }, [user, firestore, isUserLoading]);

    // Data fetching for services from all collections
    const carRentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'carRentals') : null, [firestore]);
    const hotelsRef = useMemoFirebase(() => firestore ? collection(firestore, 'hotels') : null, [firestore]);
    const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);

    const { data: carRentals, isLoading: carsLoading } = useCollection(carRentalsRef);
    const { data: hotels, isLoading: hotelsLoading } = useCollection(hotelsRef);
    const { data: transports, isLoading: transportsLoading } = useCollection(transportsRef);

    const services = React.useMemo(() => {
        const allServices = [];
        if (carRentals) allServices.push(...carRentals.map(s => ({ ...s, category: 'cars' } as any)));
        if (hotels) allServices.push(...hotels.map(s => ({ ...s, category: 'hotels' } as any)));
        if (transports) allServices.push(...transports.map(s => ({ ...s, category: 'transport' } as any)));
        return allServices;
    }, [carRentals, hotels, transports]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };
    
    const isLoading = isUserLoading || isCheckingAdmin || carsLoading || hotelsLoading || transportsLoading;

    if (isLoading) {
        return (
            <div className="p-4 sm:px-6 sm:py-0 space-y-6">
                <Skeleton className="h-14 w-48" />
                <Skeleton className="h-10 w-full max-w-lg" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="mx-auto w-full max-w-lg text-center">
                    <CardHeader>
                        <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page. Please contact an administrator if you believe this is an error.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={() => router.push('/login')}>Return to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
                <h1 className="text-2xl font-headline">Admin Dashboard</h1>
                {user && <Badge variant="secondary" className="hidden sm:inline-flex">Logged in as {user.email}</Badge>}
                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="p-4 sm:px-6 sm:py-0">
                <ServiceManagement services={services} />
            </main>
        </div>
    );
}
