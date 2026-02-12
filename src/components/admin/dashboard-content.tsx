'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import BookingManagement from './booking-management';

export default function DashboardContent() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const settings = useSettings();
    
    const [emailTemplate, setEmailTemplate] = React.useState('');
    const [clientEmailTemplate, setClientEmailTemplate] = React.useState('');
    const [categorySettings, setCategorySettings] = React.useState({});
    const [settingsLoading, setSettingsLoading] = React.useState(true);
    
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [serviceToEdit, setServiceToEdit] = React.useState<Service | null>(null);

    // Fetch admin profile to check for superadmin status
    const adminProfileRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'roles_admin', user.uid) : null, [user, firestore]);
    const { data: adminProfile, isLoading: isAdminProfileLoading } = useDoc(adminProfileRef);
    const isSuperAdmin = adminProfile?.role === 'superadmin';

    // Fetch settings
    React.useEffect(() => {
        setCategorySettings(settings.categories);
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
    
    // Admins are only fetched here, since this component only renders for admins.
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

    const handleAddService = () => {
        setServiceToEdit(null);
        setEditorOpen(true);
    };

    const handleEditService = (service: Service) => {
        setServiceToEdit(service);
        setEditorOpen(true);
    };
    
    const isLoading = isAdminProfileLoading || carsLoading || hotelsLoading || transportsLoading || exploreLoading || adminsLoading || settingsLoading;

    return (
        <>
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
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
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
                        <AccordionItem value="bookings">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                                Booking Management
                            </AccordionTrigger>
                            <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                                <BookingManagement />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="settings">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                                General Settings
                            </AccordionTrigger>
                            <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                                <SettingsManagement 
                                    currentWhatsappNumber={settings.whatsappNumber}
                                    currentBookingEmailTo={settings.bookingEmailTo || ''}
                                    currentResendEmailFrom={settings.resendEmailFrom || ''}
                                />
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
                )}
            </main>
            <ServiceEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                service={serviceToEdit}
            />
        </>
    );
}
