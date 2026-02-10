'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
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
import AdminManagement from '@/components/admin/admin-management';
import CategoryManagement from '@/components/admin/category-management';
import { useSettings } from '@/components/settings-provider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EmailTemplatesManagement from '@/components/admin/email-templates-management';
import MediaLibrary from '@/components/admin/media-library';

export default function AdminPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const settings = useSettings();
    
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);

    const [whatsappNumber, setWhatsappNumber] = React.useState('');
    const [emailTemplate, setEmailTemplate] = React.useState('');
    const [clientEmailTemplate, setClientEmailTemplate] = React.useState('');
    const [categorySettings, setCategorySettings] = React.useState({});
    const [settingsLoading, setSettingsLoading] = React.useState(true);
    
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(null);

    const adminProfileRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'roles_admin', user.uid) : null, [user, firestore]);
    const { data: adminProfile, isLoading: isAdminProfileLoading } = useDoc(adminProfileRef);

    // Auth check
    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Admin role check
    React.useEffect(() => {
      setIsCheckingAdmin(isAdminProfileLoading);
      if (adminProfile) {
        setIsAdmin(true);
        if (adminProfile.role === 'superadmin') {
          setIsSuperAdmin(true);
        }
      } else if (!isAdminProfileLoading) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    }, [adminProfile, isAdminProfileLoading]);

    // Fetch settings
    React.useEffect(() => {
        setWhatsappNumber(settings.whatsappNumber);
        setCategorySettings(settings.categories);
        // still need to fetch templates
        setSettingsLoading(true);
        Promise.all([
            fetch('/api/email-template').then(res => res.json()),
            fetch('/api/client-email-template').then(res => res.json())
        ]).then(([templateData, clientTemplateData]) => {
            if (templateData.template) {
                setEmailTemplate(templateData.template);
            }
            if (clientTemplateData.template) {
                setClientEmailTemplate(clientTemplateData.template);
            }
        }).catch(console.error)
          .finally(() => setSettingsLoading(false));
    }, [settings]);

    // Data fetching for services from all collections
    const carRentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'carRentals') : null, [firestore]);
    const hotelsRef = useMemoFirebase(() => firestore ? collection(firestore, 'hotels') : null, [firestore]);
    const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);
    const exploreTripsRef = useMemoFirebase(() => firestore ? collection(firestore, 'exploreTrips') : null, [firestore]);
    const adminsRef = useMemoFirebase(() => firestore ? collection(firestore, 'roles_admin') : null, [firestore]);

    const { data: carRentals, isLoading: carsLoading } = useCollection(carRentalsRef);
    const { data: hotels, isLoading: hotelsLoading } = useCollection(hotelsRef);
    const { data: transports, isLoading: transportsLoading } = useCollection(transportsRef);
    const { data: exploreTrips, isLoading: exploreLoading } = useCollection(exploreTripsRef);
    const { data: admins, isLoading: adminsLoading } = useCollection(adminsRef);

    const services = React.useMemo(() => {
        const allServices: any[] = [];
        if (carRentals) allServices.push(...carRentals.map(s => ({ ...s, category: 'cars' })));
        if (hotels) allServices.push(...hotels.map(s => ({ ...s, category: 'hotels' })));
        if (transports) allServices.push(...transports.map(s => ({ ...s, category: 'transport' })));
        if (exploreTrips) allServices.push(...exploreTrips.map(s => ({ ...s, category: 'explore' })));
        return allServices;
    }, [carRentals, hotels, transports, exploreTrips]);

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
        const dataToSave = { email: user.email, createdAt: serverTimestamp(), role: 'admin' };

        try {
            await setDoc(adminDocRef, dataToSave);
            toast({ title: "Success!", description: "Admin access granted. Welcome to the dashboard. To manage users, ask a superadmin to promote your account." });
            setIsAdmin(true); 
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
    
    const isLoading = isUserLoading || isCheckingAdmin || carsLoading || hotelsLoading || transportsLoading || exploreLoading || adminsLoading || settingsLoading;

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
                 {user && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                        {user.email} {isSuperAdmin && <span className="ml-1.5 font-bold">(Super Admin)</span>}
                    </Badge>
                )}
                <div className="ml-auto">
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="p-4 sm:px-6 sm:py-0">
                <Accordion type="multiple" defaultValue={['services']} className="w-full space-y-4">
                    <AccordionItem value="services">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Service Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <ServiceManagement 
                                services={services} 
                                onAdd={handleAddService} 
                                onEdit={handleEditService} 
                            />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="settings">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            General Settings
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <SettingsManagement currentWhatsappNumber={whatsappNumber} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="categories">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Category Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <CategoryManagement currentSettings={categorySettings} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="email-templates">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Email Templates
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <EmailTemplatesManagement 
                                currentAdminTemplate={emailTemplate} 
                                currentClientTemplate={clientEmailTemplate} 
                            />
                        </AccordionContent>
                    </AccordionItem>
                    {isSuperAdmin && admins && adminProfile && (
                        <AccordionItem value="admins">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                                Administrator Management
                            </AccordionTrigger>
                            <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                                <AdminManagement admins={admins} currentUser={adminProfile} />
                            </AccordionContent>
                        </AccordionItem>
                    )}
                     {isSuperAdmin && (
                        <AccordionItem value="media">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                                Media Library
                            </AccordionTrigger>
                            <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                                <MediaLibrary />
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </main>
            <ServiceEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                service={serviceToEdit}
            />
        </div>
    );
}
