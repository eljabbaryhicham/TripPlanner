'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CarsPage() {
  const firestore = useFirestore();
  const carRentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'carRentals') : null, [firestore]);
  const { data: carServices, isLoading } = useCollection(carRentalsRef);

  const activeCarServices = React.useMemo(() => {
    return carServices?.filter(service => service.isActive !== false) ?? [];
  }, [carServices]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Car className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                Car Rentals
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                Find the perfect vehicle for your journey.
              </p>
            </div>
            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
               </div>
            ) : (
              <ServiceList services={activeCarServices} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
