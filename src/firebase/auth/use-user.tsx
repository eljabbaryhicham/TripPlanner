'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

export interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to Firebase auth state changes. This is the single source of truth for auth state.
 * @returns {UseUserResult} Object with user, isUserLoading, error.
 */
export function useUser(): UseUserResult {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // useAuth throws if auth is not available, so this effect will run
    // once the auth instance is ready.
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      },
      (error) => {
        console.error('Authentication error in useUser:', error);
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading, error };
}
