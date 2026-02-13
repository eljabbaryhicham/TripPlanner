
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SettingsProvider } from '@/components/settings-provider';
import { adminFirestore } from '@/firebase/admin';

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
  },
  heroBackgroundImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  suggestionsBackgroundImageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=2052&auto=format&fit=crop",
  categoryImages: {
    cars: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop",
    hotels: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
    transport: "https://images.unsplash.com/photo-1579362629245-c464d1ab5537?q=80&w=800&auto=format&fit=crop",
    explore: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = { ...defaultSettings }; // Start with defaults
  try {
    const db = adminFirestore;
    const settingsDoc = await db.collection('app_settings').doc('general').get();
    if (settingsDoc.exists) {
        const firestoreSettings = settingsDoc.data();
        // Deep merge with defaults to ensure all keys are present
        settings = {
          ...defaultSettings,
          ...firestoreSettings,
          categories: {
            ...defaultSettings.categories,
            ...(firestoreSettings?.categories || {})
          },
          categoryImages: {
            ...defaultSettings.categoryImages,
            ...(firestoreSettings?.categoryImages || {})
          }
        };
    } else {
        console.log("No settings document found in Firestore, using defaults. First save in admin dashboard will create it.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Could not load settings from Firestore, using defaults:", errorMessage);
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
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
