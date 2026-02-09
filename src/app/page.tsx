'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

import Header from '@/components/header';
import AiSuggestions from '@/components/ai-suggestions';
import { Button } from '@/components/ui/button';
import BestServicesSection from '@/components/best-services-section';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const firestore = useFirestore();
  
  const carRentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'carRentals') : null, [firestore]);
  const hotelsRef = useMemoFirebase(() => firestore ? collection(firestore, 'hotels') : null, [firestore]);
  const transportsRef = useMemoFirebase(() => firestore ? collection(firestore, 'transports') : null, [firestore]);
  const exploreTripsRef = useMemoFirebase(() => firestore ? collection(firestore, 'exploreTrips') : null, [firestore]);

  const { data: carRentals, isLoading: carsLoading } = useCollection(carRentalsRef);
  const { data: hotels, isLoading: hotelsLoading } = useCollection(hotelsRef);
  const { data: transports, isLoading: transportsLoading } = useCollection(transportsRef);
  const { data: exploreTrips, isLoading: exploreLoading } = useCollection(exploreTripsRef);

  const services = React.useMemo(() => {
    const allServices: any[] = [];
    if (carRentals) allServices.push(...carRentals.map(s => ({...s, category: 'cars'})));
    if (hotels) allServices.push(...hotels.map(s => ({...s, category: 'hotels'})));
    if (transports) allServices.push(...transports.map(s => ({...s, category: 'transport'})));
    if (exploreTrips) allServices.push(...exploreTrips.map(s => ({...s, category: 'explore'})));
    return allServices;
  }, [carRentals, hotels, transports, exploreTrips]);

  const isLoading = carsLoading || hotelsLoading || transportsLoading || exploreLoading;
  
  const activeServices = services.filter(service => service.isActive !== false);
  const bestOffers = activeServices.filter((service) => service.isBestOffer);

  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
      <Header />
      <main>
        <section
          className="relative flex min-h-screen snap-start items-center justify-center text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              TriPlanner
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90 md:text-xl">
              Your ultimate travel planning assistant. Seamlessly book cars,
              hotels, and transport.
            </p>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="mt-8 border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
            >
              <Link href="#best-services">
                Explore Services
                <ArrowDown className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <AiSuggestions />
        
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="container mx-auto px-4 space-y-8">
                <Skeleton className="h-10 w-1/3 mx-auto" />
                <Skeleton className="h-10 w-2/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
          </div>
        ) : (
          <BestServicesSection bestOffers={bestOffers} />
        )}
      </main>
    </div>
  );
}
