'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { services } from '@/lib/data';
import {
    logout,
    updateWhatsappNumber,
    toggleBestOffer,
    addAdmin,
    removeAdmin,
    setSuperAdmin,
    getCurrentUser,
    getAdmins,
} from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Save, UserPlus, Trash2, ShieldCheck, Crown, Loader2, UserX, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

function UpdateSettingsForm({ whatsappNumber }: { whatsappNumber: string }) {
    const [state, formAction] = useActionState(updateWhatsappNumber, { error: null, success: false });
    const { toast } = useToast();

    React.useEffect(() => {
        if (state.success) {
            toast({
                title: "Settings Updated",
                description: "The WhatsApp number has been saved.",
            });
        }
        if (state.error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: state.error,
            });
        }
    }, [state, toast]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    type="text"
                    placeholder="+1234567890"
                    required
                    defaultValue={whatsappNumber}
                />
            </div>
            {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Settings
            </Button>
        </form>
    );
}

function BestOfferToggle({ serviceId, isBestOffer }: { serviceId: string; isBestOffer: boolean }) {
    // Correctly use useActionState to manage form state and actions.
    const [state, formAction] = useActionState(toggleBestOffer, { error: null, success: false });
    const formRef = React.useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    // Effect to show toast notifications based on the result of the server action.
    React.useEffect(() => {
        if (state.success) {
            toast({
                title: "Best Offer Updated",
            });
        }
        if (state.error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: state.error,
            });
        }
    }, [state, toast]);

    return (
        // The form's action is now correctly bound to the `formAction` from `useActionState`.
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="serviceId" value={serviceId} />
            <Checkbox
                name="isBestOffer"
                defaultChecked={isBestOffer}
                // When the checkbox state changes, programmatically submit the form.
                // This will trigger the server action.
                onCheckedChange={() => {
                    setTimeout(() => formRef.current?.requestSubmit(), 50);
                }}
            />
        </form>
    );
}

function AddAdminForm({ onAdminAdded }: { onAdminAdded: () => void }) {
    const [state, formAction] = useActionState(addAdmin, { error: null, success: false });
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            toast({ title: "Admin Added", description: "The new admin has been created." });
            formRef.current?.reset();
            onAdminAdded();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: "Failed to Add Admin", description: state.error });
        }
    }, [state, toast, onAdminAdded]);

    return (
        <form action={formAction} ref={formRef} className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">Add New Admin</h4>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="login">Login</Label>
                    <Input id="login" name="login" type="text" placeholder="newadmin" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit"><UserPlus /> Add Admin</Button>
        </form>
    );
}


function RemoveAdminForm({ adminId, onActionComplete }: { adminId: string, onActionComplete: () => void }) {
    const [state, formAction] = useActionState(removeAdmin, { error: null, success: false });
    const { toast } = useToast();
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success) {
            toast({ title: "Admin removed." });
            onActionComplete();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: "Action Failed", description: state.error });
        }
    }, [state, toast, onActionComplete]);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={adminId} />
            <Button type="submit" variant="destructive" size="sm" disabled={pending}><UserX /></Button>
        </form>
    );
}

function SetSuperAdminForm({ adminId, onActionComplete }: { adminId: string, onActionComplete: () => void }) {
    const [state, formAction] = useActionState(setSuperAdmin, { error: null, success: false });
    const { toast } = useToast();
    const { pending } = useFormStatus();

    useEffect(() => {
        if (state.success) {
            toast({ title: "Super admin updated." });
            onActionComplete();
        }
        if (state.error) {
            toast({ variant: 'destructive', title: "Action Failed", description: state.error });
        }
    }, [state, toast, onActionComplete]);

    return (
        <form action={formAction}>
            <input type="hidden" name="id" value={adminId} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}><UserCheck /></Button>
        </form>
    );
}


function AdminManagementCard({ admins: initialAdmins, currentUser, onAdminsChange }: { admins: any[], currentUser: any, onAdminsChange: () => void }) {

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><ShieldCheck className="mr-2" /> Admin Management</CardTitle>
                <CardDescription>Add, remove, or change admin roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Login</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialAdmins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.login}</TableCell>
                                    <TableCell>
                                        <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize">
                                            {admin.role === 'superadmin' && <Crown className="mr-1.5" />}
                                            {admin.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {admin.id !== currentUser.id && (
                                            <div className="flex justify-end gap-2">
                                                <RemoveAdminForm adminId={admin.id} onActionComplete={onAdminsChange} />
                                                {admin.role !== 'superadmin' && (
                                                    <SetSuperAdminForm adminId={admin.id} onActionComplete={onAdminsChange} />
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <Separator />
                <AddAdminForm onAdminAdded={onAdminsChange} />
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const searchParams = useSearchParams();
    const whatsappNumber = searchParams.get('whatsappNumber') || '';

    const [admins, setAdmins] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAdminData = () => {
        setIsLoading(true);
        Promise.all([getCurrentUser(), getAdmins()]).then(([user, adminsData]) => {
            setCurrentUser(user);
            setAdmins(adminsData);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
                <h1 className="text-2xl font-headline">Admin Dashboard</h1>
                {currentUser && <Badge variant="secondary" className="hidden sm:inline-flex">Logged in as {currentUser.login}</Badge>}
                <form action={logout} className="ml-auto">
                    <Button variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </header>
            <main className="p-4 sm:px-6 sm:py-0 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Services</CardTitle>
                        <CardDescription>A list of all services available on TriPlanner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Best Offer</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">{service.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <BestOfferToggle serviceId={service.id} isBestOffer={!!service.isBestOffer} />
                                        </TableCell>
                                        <TableCell>{service.location}</TableCell>
                                        <TableCell className="text-right">
                                            ${service.price}/{service.priceUnit}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>Update general settings for the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdateSettingsForm whatsappNumber={whatsappNumber} />
                    </CardContent>
                </Card>

                {currentUser && currentUser.role === 'superadmin' && (
                    <div className="lg:col-span-3">
                        <AdminManagementCard admins={admins} currentUser={currentUser} onAdminsChange={fetchAdminData} />
                    </div>
                )}
            </main>
        </div>
    );
}