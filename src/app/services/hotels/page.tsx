'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { BedDouble } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MOROCCAN_CITIES } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function HotelsPage() {
  const firestore = useFirestore();
  const hotelsRef = useMemoFirebase(() => firestore ? collection(firestore, 'hotels') : null, [firestore]);
  const { data: hotelServices, isLoading } = useCollection(hotelsRef);
  const [selectedCity, setSelectedCity] = React.useState('all');

  const activeHotelServices = React.useMemo(() => {
    return hotelServices?.filter(service => service.isActive !== false) ?? [];
  }, [hotelServices]);
  
  const filteredHotels = React.useMemo(() => {
    if (selectedCity === 'all') {
      return activeHotelServices;
    }
    return activeHotelServices.filter(hotel => hotel.location === selectedCity);
  }, [activeHotelServices, selectedCity]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <BedDouble className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                Hotels & Hostels
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                Discover your home away from home.
              </p>
            </div>
            
            <div className="mb-8 flex justify-center">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {MOROCCAN_CITIES.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
             {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
                  <Skeleton className="h-96" />
               </div>
            ) : (
              <ServiceList services={filteredHotels} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
