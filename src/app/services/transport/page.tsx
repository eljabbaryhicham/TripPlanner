'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import TransportPageContent from '@/components/transport-page-content';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ServerCrash, Archive } from 'lucide-react';

const PageMessage = ({ icon, title, message }: { icon: React.ReactNode, title: string, message: string }) => (
    <div className="text-center py-20 space-y-4">
        <div className="inline-block p-4 bg-muted rounded-full">
            {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-foreground/80 max-w-md mx-auto">{message}</p>
    </div>
);

export default function TransportPage() {
  const firestore = useFirestore();
  const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);
  const { data: services, isLoading: servicesLoading } = useCollection(transportsRef);
  
  const [settings, setSettings] = React.useState<{ categories?: { transport?: boolean } }>({});
  const [settingsLoading, setSettingsLoading] = React.useState(true);

  React.useEffect(() => {
      fetch('/api/settings')
          .then(res => res.json())
          .then(data => setSettings(data))
          .catch(console.error)
          .finally(() => setSettingsLoading(false));
  }, []);

  const isLoading = servicesLoading || settingsLoading;

  if (isLoading) {
     return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-4xl space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-20 w-full" />
            </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderMessagePage = (icon: React.ReactNode, title: string, message: string) => (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <PageMessage icon={icon} title={title} message={message} />
      </main>
      <Footer />
    </div>
  );

  if (settings.categories?.transport === false) {
    return renderMessagePage(<AlertTriangle className="h-10 w-10 text-primary" />, "Service Unavailable", "This service category is currently disabled. Please check back later.");
  }
  
  const hasServices = services && services.length > 0;
  if (!hasServices) {
    return renderMessagePage(<Archive className="h-10 w-10 text-primary" />, "No Service Available", "This service is not available. Please check back later.");
  }

  const allInactive = hasServices && services.every(s => s.isActive === false);
  if (allInactive) {
    return renderMessagePage(<ServerCrash className="h-10 w-10 text-primary" />, "Service Is Busy", "This service is temporarily unavailable. We'll be back soon!");
  }

  const service = services.find(s => s.isActive !== false) as Service | undefined;
  if (!service) {
      // This case should be covered by allInactive, but serves as a fallback.
      return renderMessagePage(<Archive className="h-10 w-10 text-primary" />, "No Active Service", "Could not find an active transport service.");
  }

  return <TransportPageContent service={service} />;
}
