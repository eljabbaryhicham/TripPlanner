
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
        cars: string;
        hotels: string;
        transport: string;
        explore: string;
    };
}

const SettingsContext = createContext<AppSettings | null>(null);

export function SettingsProvider({ defaultSettings, children }: { defaultSettings: AppSettings, children: ReactNode }) {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'app_settings', 'general') : null), [firestore]);
  const { data: firestoreSettings } = useDoc<Partial<AppSettings>>(settingsRef);

  const settings = useMemo(() => {
    if (firestoreSettings) {
        // Deep merge fetched settings with defaults
        return {
          ...defaultSettings,
          ...firestoreSettings,
          categories: {
            ...defaultSettings.categories,
            ...(firestoreSettings.categories || {})
          },
          categoryImages: {
            ...defaultSettings.categoryImages,
            ...(firestoreSettings.categoryImages || {})
          }
        };
    }
    // Return defaults if nothing is fetched yet or on first render
    return defaultSettings;
  }, [firestoreSettings, defaultSettings]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === null) {
    throw new Error('useSettings must be used within a SettingsProvider. Make sure it is wrapping your app in the root layout.');
  }
  return context;
}
