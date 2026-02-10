'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Car, ServerCrash, Archive, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '@/components/settings-provider';
import PageMessage from '@/components/page-message';

export default function CarsPage() {
  const firestore = useFirestore();
  const carRentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'carRentals') : null, [firestore]);
  const { data: carServices, isLoading: servicesLoading } = useCollection(carRentalsRef);

  const settings = useSettings();
  const [priceRange, setPriceRange] = React.useState('all');
  const [seats, setSeats] = React.useState('all');

  const hasServices = carServices && carServices.length > 0;
  const allInactive = hasServices && carServices.every(s => s.isActive === false);

  const filteredCarServices = React.useMemo(() => {
    let services = carServices?.filter(service => service.isActive !== false) ?? [];

    if (priceRange !== 'all') {
      services = services.filter(service => {
        switch (priceRange) {
          case 'lt-50': return service.price < 50;
          case '50-100': return service.price >= 50 && service.price <= 100;
          case 'gt-100': return service.price > 100;
          default: return true;
        }
      });
    }

    if (seats !== 'all') {
      services = services.filter(service => {
        const numSeats = parseInt(service.details?.Seats, 10);
        if (isNaN(numSeats)) return false;
        switch (seats) {
          case '2-4': return numSeats >= 2 && numSeats <= 4;
          case '5+': return numSeats >= 5;
          default: return true;
        }
      });
    }

    return services;
  }, [carServices, priceRange, seats]);

  const isLoading = servicesLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
         </div>
      );
    }
    
    if (settings.categories?.cars === false) {
      return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Service Unavailable" message="This service category is currently disabled. Please check back later." />;
    }

    if (!hasServices) {
        return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Services Available" message="There are currently no services in this category. Please check back later." />;
    }

    if (allInactive) {
        return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Services Are Busy" message="All services in this category are temporarily unavailable. We'll be back soon!" />;
    }
    
    if(filteredCarServices.length === 0) {
        return <p className="text-center text-lg text-foreground/80">No cars match your current filters.</p>;
    }

    return <ServiceList services={filteredCarServices} />;
  };

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

            {!isLoading && settings.categories?.cars !== false && hasServices && !allInactive && (
              <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4">
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Price</SelectItem>
                    <SelectItem value="lt-50">Under $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="gt-100">Over $100</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={seats} onValueChange={setSeats}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by seats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Seats</SelectItem>
                    <SelectItem value="2-4">2-4 Seats</SelectItem>
                    <SelectItem value="5+">5+ Seats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {renderContent()}

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
