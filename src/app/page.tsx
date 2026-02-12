'use client';

import * as React from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

import Header from '@/components/header';
import AiSuggestions from '@/components/ai-suggestions';
import BestServicesSection from '@/components/best-services-section';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/components/settings-provider';
import Footer from '@/components/footer';
import CategorySlideshow from '@/components/category-slideshow';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

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
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
      <Header />
      <main>
        <section
          className="relative flex min-h-screen snap-start flex-col items-center justify-center text-white"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div className="container relative mx-auto px-4 text-center z-10 pt-24 pb-8">
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              TriPlanner
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90 md:text-xl">
              Your ultimate travel planning assistant. Discover and book your next adventure.
            </p>
          </div>
          <div className="relative w-full z-10 flex-1 flex items-center">
            <CategorySlideshow />
          </div>
           <div className="absolute bottom-16 z-10 animate-bounce">
            <Link href="#best-services" scroll={true}>
              <Button
                variant="outline"
                className="rounded-full h-14 w-14 p-0 bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="sr-only">Scroll to next section</span>
                <ArrowDown className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </section>

        <AiSuggestions />
        
        <section
          id="best-services"
          className="flex min-h-screen snap-start flex-col"
        >
          <div className="flex flex-1 items-center justify-center">
            {renderBestServices()}
          </div>
          <Footer />
        </section>
      </main>
    </div>
  );
}
