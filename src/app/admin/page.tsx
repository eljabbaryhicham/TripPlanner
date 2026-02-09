'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Star, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import ServiceManagement from '@/components/admin/service-management';
import SettingsManagement from '@/components/admin/settings-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import DatabaseSeeder from '@/components/admin/database-seeder';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
    const [settings, setSettings] = React.useState({ whatsappNumber: '' });
    const [debugInfo, setDebugInfo] = React.useState<string | null>(null);

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
                    const docExists = adminDocSnap.exists();
                    setIsAdmin(docExists);
                     if (!docExists) {
                        setDebugInfo(`Your UID is: ${user.uid}. The application checked for an admin role document at 'roles_admin/${user.uid}' but did not find it. Please ensure the document exists and the ID is an exact match.`);
                    }
                } catch (error: any) {
                    setIsAdmin(false);
                    setDebugInfo(`An error occurred while checking for admin role: ${error.message}. Your UID is: ${user.uid}. This is likely a security rules issue that needs to be resolved.`);
                    console.error("Admin role check failed:", error);
                } finally {
                    setIsCheckingAdmin(false);
                }
            };
            checkAdminRole();
        } else if (!isUserLoading) {
            setIsCheckingAdmin(false);
        }
    }, [user, firestore, isUserLoading]);

    // Settings fetch
    React.useEffect(() => {
        fetch('/api/settings').then(res => res.json()).then(setSettings).catch(console.error);
    }, []);

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
                        {user && debugInfo && (
                            <Card className="mt-4 text-left text-sm bg-secondary">
                                <CardHeader>
                                    <CardTitle className="text-base">Debugging Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-mono bg-background p-2 rounded text-xs">{debugInfo}</p>
                                </CardContent>
                            </Card>
                        )}
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
                <Tabs defaultValue="services">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm mb-6">
                        <TabsTrigger value="services">
                            <Star className="mr-2 h-4 w-4" />
                            Services
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="services">
                        <ServiceManagement services={services} />
                    </TabsContent>
                    <TabsContent value="settings">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Application Settings</CardTitle>
                                    <CardDescription>Update general application settings.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SettingsManagement currentWhatsappNumber={settings.whatsappNumber} />
                                </CardContent>
                            </Card>
                            <DatabaseSeeder />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
