
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { useAuth } from '@/firebase';

export interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to Firebase auth state changes.
 * @returns {UseUserResult} Object with user, isLoading, error.
 */
export function useUser(): UseUserResult {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      setError(new Error('Firebase Auth instance is not available.'));
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      },
      (error) => {
        console.error('Authentication error:', error);
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading, error };
}
