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
import { useSettings } from '@/components/settings-provider';
import PageMessage from '@/components/page-message';

export default function TransportPage() {
  const firestore = useFirestore();
  const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);
  const { data: services, isLoading: servicesLoading } = useCollection(transportsRef);
  
  const settings = useSettings();

  const isLoading = servicesLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (settings.categories?.transport === false) {
      return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Service Unavailable" message="This service category is currently disabled. Please check back later." />;
    }
    
    const hasServices = services && services.length > 0;
    if (!hasServices) {
      return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Service Available" message="This service is not available. Please check back later." />;
    }

    const allInactive = hasServices && services.every(s => s.isActive === false);
    if (allInactive) {
      return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Service Is Busy" message="This service is temporarily unavailable. We'll be back soon!" />;
    }

    const service = services.find(s => s.isActive !== false) as Service | undefined;
    if (!service) {
        return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Active Service" message="Could not find an active transport service." />;
    }

    return <TransportPageContent service={service} />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="py-16 md:py-24">
            {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
