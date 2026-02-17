
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import Header from '@/components/header';
import AiSuggestions from '@/components/ai-suggestions';
import BestServicesSection from '@/components/best-services-section';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/components/settings-provider';
import CategorySlideshow from '@/components/category-slideshow';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Footer from '@/components/footer';

export default function Home() {
  const firestore = useFirestore();
  const settings = useSettings();

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
  
  const renderBestServices = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 space-y-8">
            <Skeleton className="h-10 w-1/3 mx-auto" />
            <Skeleton className="h-10 w-2/3 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
      );
    }
    
    return <BestServicesSection 
      allServices={services} 
      categoryServices={{carRentals, hotels, transports, exploreTrips}} 
      categorySettings={settings.categories || {}}
    />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {settings.isSettingsLoading ? (
            <section className="relative flex min-h-screen flex-col items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </section>
        ) : (
          <section
            className="relative flex min-h-screen flex-col items-center justify-between pt-24"
            style={{
              backgroundImage: `url('${settings.heroBackgroundImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/70" />
            
            <div className="relative z-10 w-full">
              <div className="container mx-auto px-4 text-center">
                <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white">
                  TriPlanner
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90 md:text-xl">
                  Your ultimate travel planning assistant. Discover and book your next adventure.
                </p>
              </div>
              <div className="w-full mt-8">
                <CategorySlideshow />
              </div>
            </div>

            <div className="relative z-10 text-center pb-28 sm:pb-32">
              <p className="mb-4 font-handwriting text-2xl sm:text-3xl text-white/90">Explore Our Best Services</p>
              <Link href="#best-services" scroll={true}>
                <Button
                  variant="outline"
                  className="rounded-full h-12 w-12 sm:h-14 sm:w-14 p-0 bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm animate-bounce text-white"
                >
                  <span className="sr-only">Scroll to next section</span>
                  <ArrowDown className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        <section
          id="best-services"
          className="py-20 sm:py-24 md:py-32"
        >
          {renderBestServices()}
        </section>
        
         <section
          className="relative min-h-[50vh] flex flex-col text-white"
        >
          <div className="flex-grow flex items-center justify-center">
             <AiSuggestions />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
