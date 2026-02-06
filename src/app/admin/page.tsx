'use client';

import { useEffect, useState } from 'react';
import { logout, getCurrentUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCurrentUser().then(user => {
            setCurrentUser(user);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        })
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
            <main className="p-4 sm:px-6 sm:py-0">
                 <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Welcome to Your Dashboard</CardTitle>
                        <CardDescription>You have successfully logged into the admin panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentUser ? (
                            <p>Welcome back, <span className="font-bold">{currentUser.login}</span>! Your role is: <span className="capitalize font-medium">{currentUser.role}</span>.</p>
                        ) : (
                            <p>Could not retrieve your user information. Please try logging out and back in.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
