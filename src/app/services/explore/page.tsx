'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Compass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExplorePage() {
  const firestore = useFirestore();
  const exploreTripsRef = useMemoFirebase(() => firestore ? collection(firestore, 'exploreTrips') : null, [firestore]);
  const { data: exploreServices, isLoading } = useCollection(exploreTripsRef);

  const activeExploreServices = React.useMemo(() => {
    return exploreServices?.filter(service => service.isActive !== false) ?? [];
  }, [exploreServices]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Compass className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                Explore Morocco
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                Join our organized trips and discover the wonders of Morocco with fellow travelers.
              </p>
            </div>
            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
               </div>
            ) : (
              <ServiceList services={activeExploreServices} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
