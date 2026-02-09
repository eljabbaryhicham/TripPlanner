'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import ServiceManagement from '@/components/admin/service-management';
import SettingsManagement from '@/components/admin/settings-management';
import { useToast } from '@/hooks/use-toast';
import { ServiceEditor } from '@/components/admin/service-editor';
import type { Service } from '@/lib/types';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
    const [whatsappNumber, setWhatsappNumber] = React.useState('');
    const [settingsLoading, setSettingsLoading] = React.useState(true);
    
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(null);

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
                setIsCheckingAdmin(true);
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

    // Fetch settings
    React.useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.whatsappNumber) {
                    setWhatsappNumber(data.whatsappNumber);
                }
            })
            .catch(console.error)
            .finally(() => setSettingsLoading(false));
    }, []);

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
    
    const grantAdminAccess = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'User or database not available.' });
            return;
        }

        const adminDocRef = doc(firestore, 'roles_admin', user.uid);
        const dataToSave = { email: user.email, createdAt: serverTimestamp() };

        try {
            await setDoc(adminDocRef, dataToSave);
            toast({ title: "Success!", description: "Admin access granted. Welcome to the dashboard." });
            setIsAdmin(true); // Manually update state to re-render the dashboard
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

    const handleAddService = () => {
        setServiceToEdit(null);
        setEditorOpen(true);
    };

    const handleEditService = (service: Service) => {
        setServiceToEdit(service);
        setEditorOpen(true);
    };
    
    const isLoading = isUserLoading || isCheckingAdmin || carsLoading || hotelsLoading || transportsLoading || settingsLoading;

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
                <SettingsManagement currentWhatsappNumber={whatsappNumber} />
                <ServiceManagement 
                    services={services} 
                    onAdd={handleAddService} 
                    onEdit={handleEditService} 
                />
            </main>
            <ServiceEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                service={serviceToEdit}
            />
        </div>
    );
}
