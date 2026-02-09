'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Service } from '@/lib/types';
import TransportPageContent from '@/components/transport-page-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransportPage() {
  const firestore = useFirestore();
  const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);
  const { data: services, isLoading } = useCollection(transportsRef);

  const activeServices = React.useMemo(() => {
    return services?.filter(service => service.isActive !== false);
  }, [services]);

  const service: Service | undefined = activeServices?.[0] as Service | undefined;

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

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Service not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return <TransportPageContent service={service} />;
}
