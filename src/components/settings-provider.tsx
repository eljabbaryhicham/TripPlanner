'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Category } from '@/lib/types';

export interface AppSettings {
    logoUrl?: string;
    whatsappNumber: string;
    bookingEmailTo: string;
    resendEmailFrom: string;
    categories: Category[];
    heroBackgroundImageUrl?: string;
    suggestionsBackgroundImageUrl?: string;
}

interface SettingsContextType extends AppSettings {
  isSettingsLoading: boolean;
}


const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ defaultSettings, children }: { defaultSettings: AppSettings, children: ReactNode }) {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'app_settings', 'general') : null), [firestore]);
  const { data: firestoreSettings, isLoading: isSettingsLoading } = useDoc<Partial<AppSettings>>(settingsRef);

  const settings = useMemo(() => {
    if (firestoreSettings) {
        // Exclude properties like 'id' from the merge to match AppSettings type.
        const { id, ...restOfFirestoreSettings } = firestoreSettings as any;

        // If firestore has a valid categories array, use it. Otherwise, fall back to defaults.
        const categories = Array.isArray(restOfFirestoreSettings.categories) && restOfFirestoreSettings.categories.length > 0
            ? restOfFirestoreSettings.categories
            : defaultSettings.categories;

        return {
          ...defaultSettings,
          ...restOfFirestoreSettings,
          categories,
        };
    }
    // Return defaults if nothing is fetched yet or on first render
    return defaultSettings;
  }, [firestoreSettings, defaultSettings]);

  const contextValue = useMemo(() => ({
    ...settings,
    isSettingsLoading,
  }), [settings, isSettingsLoading]);


  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === null) {
    throw new Error('useSettings must be used within a SettingsProvider. Make sure it is wrapping your app in the root layout.');
  }
  return context;
}