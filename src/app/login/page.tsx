'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mountain, LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Only redirect if the user is fully authenticated and NOT anonymous.
    if (!isUserLoading && user && !user.isAnonymous) {
        router.push('/admin');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized.');
      }
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      // Use router.push for SPA navigation instead of a full page reload.
      router.push('/admin');
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred.';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        default:
          errorMessage = 'Failed to log in. Please try again later.';
          break;
      }
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Login Failed', description: errorMessage });
      setIsLoading(false);
    }
  };

  // Show a loader while checking auth state OR if a real user is found and we are redirecting.
  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished and user is null or anonymous, show the login form.
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <Mountain className="mx-auto h-8 w-8 mb-2" />
          <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the TriPlanner dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
