'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldCheck, Loader2, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import ServiceManagement from '@/components/admin/service-management';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import seedData from '@/lib/placeholder-images.json';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = React.useState(false);
    
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
        const allServices: any[] = [];
        if (carRentals) allServices.push(...carRentals.map(s => ({ ...s, category: 'cars' })));
        if (hotels) allServices.push(...hotels.map(s => ({ ...s, category: 'hotels' })));
        if (transports) allServices.push(...transports.map(s => ({ ...s, category: 'transport' })));
        return allServices;
    }, [carRentals, hotels, transports]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/login');
        }
    };

    const handleSeedDatabase = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            return;
        }
        setIsSeeding(true);

        const promises = seedData.services.map(service => {
            let collectionPath: string;
            switch ((service as any).category) {
                case 'cars': collectionPath = 'carRentals'; break;
                case 'hotels': collectionPath = 'hotels'; break;
                case 'transport': collectionPath = 'transports'; break;
                default:
                    console.warn(`Unknown category for service ID ${service.id}. Skipping.`); 
                    return null;
            }
            const docRef = doc(firestore, collectionPath, service.id);
            return setDoc(docRef, service as any);
        }).filter(Boolean);

        try {
            await Promise.all(promises as Promise<void>[]);
            toast({ title: 'Database Seeded', description: 'Sample services have been added successfully.' });
        } catch (error: any) {
            console.error("Seeding failed:", error);
            toast({ variant: 'destructive', title: 'Seeding Failed', description: 'You may not have permission to write to the database collections.' });
        } finally {
            setIsSeeding(false);
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
            <main className="p-4 sm:px-6 sm:py-0 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Management</CardTitle>
                        <CardDescription>
                            Your services are stored in Firestore. If your database is empty, you can add the initial sample services here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleSeedDatabase} disabled={isSeeding}>
                            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Seed Database with Sample Data
                        </Button>
                    </CardContent>
                </Card>
                <ServiceManagement services={services} />
            </main>
        </div>
    );
}
