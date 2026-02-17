import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SettingsProvider } from '@/components/settings-provider';
import type { AppSettings } from '@/components/settings-provider';

export const metadata: Metadata = {
  title: 'TriPlanner',
  description: 'Your ultimate travel planning assistant.',
};

// Define a default settings structure
const defaultSettings: AppSettings = {
  logoUrl: "",
  whatsappNumber: "",
  bookingEmailTo: "",
  resendEmailFrom: "TriPlanner <onboarding@resend.dev>",
  heroBackgroundImageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  suggestionsBackgroundImageUrl: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=2052&auto=format&fit=crop",
  categories: [
    {
      id: 'cars',
      name: 'Cars',
      icon: 'Car',
      href: '/services/cars',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
      enabled: true,
    },
    {
      id: 'hotels',
      name: 'Hotels',
      icon: 'BedDouble',
      href: '/services/hotels',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
      enabled: true,
    },
    {
      id: 'transport',
      name: 'Pickup',
      icon: 'Briefcase',
      href: '/services/transport',
      imageUrl: 'https://images.unsplash.com/photo-1579362629245-c464d1ab5537?q=80&w=800&auto=format&fit=crop',
      enabled: true,
    },
    {
      id: 'explore',
      name: 'Explore',
      icon: 'Compass',
      href: '/services/explore',
      imageUrl: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop',
      enabled: true,
    },
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
        <FirebaseClientProvider>
          <SettingsProvider defaultSettings={defaultSettings}>
            {children}
          </SettingsProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}