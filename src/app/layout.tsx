
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SettingsProvider } from '@/components/settings-provider';
import fs from 'fs/promises';
import path from 'path';

export const metadata: Metadata = {
  title: 'TriPlanner',
  description: 'Your ultimate travel planning assistant.',
};

// Define a default settings structure
const defaultSettings = {
  logoUrl: "",
  whatsappNumber: "",
  bookingEmailTo: "",
  resendEmailFrom: "TriPlanner <onboarding@resend.dev>",
  categories: {
    cars: true,
    hotels: true,
    transport: true,
    explore: true
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = defaultSettings;
  try {
    const settingsFilePath = path.join(process.cwd(), 'src', 'lib', 'app-config.json');
    const settingsJson = await fs.readFile(settingsFilePath, 'utf-8');
    // Important: Merging to avoid errors if the file is missing some keys
    const fileSettings = JSON.parse(settingsJson);
    settings = {
      ...defaultSettings,
      ...fileSettings,
      categories: {
        ...defaultSettings.categories,
        ...(fileSettings.categories || {})
      }
    };
  } catch (error) {
    console.error("Could not load app-config.json, using defaults:", error);
    // settings is already defaultSettings
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SettingsProvider settings={settings}>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
        </SettingsProvider>
        <Toaster />
      </body>
    </html>
  );
}
