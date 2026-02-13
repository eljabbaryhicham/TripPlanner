
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface AppSettings {
    logoUrl?: string;
    whatsappNumber: string;
    bookingEmailTo: string;
    resendEmailFrom: string;
    categories: {
        cars: boolean;
        hotels: boolean;
        transport: boolean;
        explore: boolean;
    };
    heroBackgroundImageUrl?: string;
    suggestionsBackgroundImageUrl?: string;
    categoryImages?: {
        cars?: string;
        hotels?: string;
        transport?: string;
        explore?: string;
    };
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

        // Deep merge fetched settings with defaults
        return {
          ...defaultSettings,
          ...restOfFirestoreSettings,
          categories: {
            ...defaultSettings.categories,
            ...(restOfFirestoreSettings.categories || {})
          },
          categoryImages: {
            ...defaultSettings.categoryImages,
            ...(restOfFirestoreSettings.categoryImages || {})
          }
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
