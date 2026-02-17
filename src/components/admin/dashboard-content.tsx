'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
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
import BookingManagement from './booking-management';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import ReviewManagement from './review-management';

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

    // Fetch settings and email templates
    React.useEffect(() => {
        if (!firestore) return;

        setCategorySettings(settings.categories);
        setSettingsLoading(true);

        const adminTemplateRef = doc(firestore, 'email_templates', 'admin_notification');
        const clientTemplateRef = doc(firestore, 'email_templates', 'client_confirmation');

        Promise.all([
            getDoc(adminTemplateRef),
            getDoc(clientTemplateRef)
        ]).then(([adminDoc, clientDoc]) => {
            if (adminDoc.exists()) {
                setEmailTemplate(adminDoc.data()?.template);
            } else {
                console.warn("Admin email template not found in Firestore.");
                // Optional: set a default fallback
                setEmailTemplate("<h3>New Booking Inquiry for {{serviceName}}</h3><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p>");
            }
            if (clientDoc.exists()) {
                setClientEmailTemplate(clientDoc.data()?.template);
            } else {
                console.warn("Client email template not found in Firestore.");
                // Optional: set a default fallback
                setClientEmailTemplate("<h3>Confirmation for {{serviceName}}</h3><p>Hi {{name}},</p><p>We have received your inquiry and will get back to you soon.</p>");
            }
        }).catch(error => {
            console.error("Failed to load email templates from Firestore:", error);
            toast({
                variant: 'destructive',
                title: 'Could not load email templates',
                description: 'There was a problem fetching email templates from the database.'
            });
        }).finally(() => {
            setSettingsLoading(false);
        });
    }, [settings, firestore, toast]);

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

    const servicesLoading = carsLoading || hotelsLoading || transportsLoading || exploreLoading;

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
            <main className="p-4 sm:px-6 sm:py-0 space-y-8">
                <Accordion type="multiple" defaultValue={['bookings']} className="w-full space-y-4">
                    <AccordionItem value="bookings">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Booking Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <BookingManagement />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="services">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Service Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            <ServiceManagement 
                                services={services}
                                isLoading={servicesLoading}
                                onAdd={handleAddService} 
                                onEdit={handleEditService} 
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Settings className="h-6 w-6 text-muted-foreground" />
                        <h2 className="text-xl font-semibold text-muted-foreground">Other Settings</h2>
                    </div>
                    <Separator />
                </div>
                
                <Accordion type="multiple" className="w-full space-y-4">
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
                    {isSuperAdmin && (
                        <AccordionItem value="admins">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                                Administrator Management
                            </AccordionTrigger>
                            <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                                <AdminManagement admins={admins || []} currentUser={adminProfile} isLoading={adminsLoading} />
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    <AccordionItem value="categories">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Category Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                             {settingsLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                             ) : (
                                <CategoryManagement currentSettings={categorySettings} />
                             )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="reviews">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Review Management
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                           <ReviewManagement />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="settings">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            General Settings
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            {settingsLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-10 w-1/2" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : (
                                <SettingsManagement 
                                    currentLogoUrl={settings.logoUrl}
                                    currentWhatsappNumber={settings.whatsappNumber}
                                    currentBookingEmailTo={settings.bookingEmailTo || ''}
                                    currentResendEmailFrom={settings.resendEmailFrom || ''}
                                    currentHeroBackgroundImageUrl={settings.heroBackgroundImageUrl}
                                    currentSuggestionsBackgroundImageUrl={settings.suggestionsBackgroundImageUrl}
                                    currentCategoryImages={settings.categoryImages}
                                />
                            )}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="email-templates">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline rounded-lg bg-card border data-[state=open]:rounded-b-none">
                            Email Templates
                        </AccordionTrigger>
                        <AccordionContent className="p-0 rounded-b-lg border border-t-0 bg-card">
                            {settingsLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-40 w-full" />
                                </div>
                            ) : (
                                <EmailTemplatesManagement 
                                    currentAdminTemplate={emailTemplate} 
                                    currentClientTemplate={clientEmailTemplate} 
                                />
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </main>
            <ServiceEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                service={serviceToEdit}
            />
        </>
    );
}
