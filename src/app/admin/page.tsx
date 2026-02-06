'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Shield, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { logout } from '@/lib/actions';
import { getAdmins } from '@/lib/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import fs from 'fs/promises';
import path from 'path';

import AdminManagement from '@/components/admin/admin-management';
import ServiceManagement from '@/components/admin/service-management';
import SettingsManagement from '@/components/admin/settings-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


async function readSettings() {
  try {
    const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read settings file:', error);
    return { whatsappNumber: '' };
  }
}

export default async function AdminPage() {
    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth');
    let currentUser: { id: string, login: string; role: string } | null = null;

    if (authCookie) {
        try {
            currentUser = JSON.parse(authCookie.value);
        } catch (e) {
            // Invalid cookie
        }
    }

    if (!currentUser) {
        redirect('/login');
    }

    const admins = await getAdmins();
    const services = PlaceHolderImages;
    const settings = await readSettings();

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
            <main className="p-4 sm:px-6 sm:py-0">
                <Tabs defaultValue="services">
                    <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
                        <TabsTrigger value="services">
                            <Star className="mr-2 h-4 w-4" />
                            Services
                        </TabsTrigger>
                        <TabsTrigger value="admins" disabled={currentUser.role !== 'superadmin'}>
                             <Shield className="mr-2 h-4 w-4" />
                            Admins
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                             <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="services">
                        <Card>
                            <CardHeader>
                                <CardTitle>Services Management</CardTitle>
                                <CardDescription>Toggle 'Best Offer' status for services. Changes are saved automatically.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ServiceManagement services={services} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="admins">
                         {currentUser.role === 'superadmin' ? (
                            <AdminManagement admins={admins} currentUser={currentUser} />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Permission Denied</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>You do not have permission to manage administrators.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Settings</CardTitle>
                                <CardDescription>Update general application settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SettingsManagement currentWhatsappNumber={settings.whatsappNumber} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}