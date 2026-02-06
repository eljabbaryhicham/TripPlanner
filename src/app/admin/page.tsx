'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { logout } from '@/lib/actions';

export default async function AdminPage() {
    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth');
    let currentUser: { login: string; role: string } | null = null;

    if (authCookie) {
        try {
            currentUser = JSON.parse(authCookie.value);
        } catch (e) {
            // Invalid cookie, treat as not logged in
        }
    }

    // If no valid user, redirect to login. This is a secondary check to the middleware.
    if (!currentUser) {
        redirect('/login');
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
            <main className="p-4 sm:px-6 sm:py-0">
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Welcome to Your Dashboard</CardTitle>
                        <CardDescription>You have successfully logged into the admin panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Welcome back, <span className="font-bold">{currentUser.login}</span>! Your role is: <span className="capitalize font-medium">{currentUser.role}</span>.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
