
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

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

export function SettingsProvider({ settings, children }: { settings: AppSettings, children: ReactNode }) {
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
