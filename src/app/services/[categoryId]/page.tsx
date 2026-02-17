'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { ServerCrash, Archive, AlertTriangle, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/components/settings-provider';
import PageMessage from '@/components/page-message';
import { Icon } from '@/components/icon';
import type { Service, ServiceCategory } from '@/lib/types';
import TransportPageContent from '@/components/transport-page-content';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOROCCAN_CITIES } from '@/lib/constants';

// This function maps category IDs to Firestore collection names.
const getCollectionPath = (category: ServiceCategory) => {
    switch(category) {
        case 'cars': return 'carRentals';
        case 'hotels': return 'hotels';
        case 'transport': return 'transports';
        case 'explore': return 'exploreTrips';
        default: return category; // For new, custom categories
    }
};

export default function ServicesByCategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;

  const firestore = useFirestore();
  const settings = useSettings();
  
  // State for filters
  const [priceRange, setPriceRange] = React.useState('all');
  const [seats, setSeats] = React.useState('all');
  const [selectedCity, setSelectedCity] = React.useState('all');
  
  const category = React.useMemo(() => {
    return settings.categories.find(c => c.id === categoryId);
  }, [settings.categories, categoryId]);

  const collectionPath = React.useMemo(() => getCollectionPath(categoryId), [categoryId]);

  const servicesRef = useMemoFirebase(
    () => (firestore && collectionPath ? collection(firestore, collectionPath) : null),
    [firestore, collectionPath]
  );
  
  const { data: services, isLoading: servicesLoading } = useCollection(servicesRef);

  const filteredServices = React.useMemo(() => {
    let activeServices = services?.filter(service => service.isActive !== false) ?? [];
    
    if (categoryId === 'cars') {
        if (priceRange !== 'all') {
            activeServices = activeServices.filter(service => {
                switch (priceRange) {
                case 'lt-50': return service.price < 50;
                case '50-100': return service.price >= 50 && service.price <= 100;
                case 'gt-100': return service.price > 100;
                default: return true;
                }
            });
        }
        if (seats !== 'all') {
            activeServices = activeServices.filter(service => {
                const numSeats = parseInt(service.details?.Seats, 10);
                if (isNaN(numSeats)) return false;
                switch (seats) {
                case '2-4': return numSeats >= 2 && numSeats <= 4;
                case '5+': return numSeats >= 5;
                default: return true;
                }
            });
        }
    }

    if (categoryId === 'hotels') {
        if (selectedCity !== 'all') {
            activeServices = activeServices.filter(hotel => hotel.location === selectedCity);
        }
    }
    
    return activeServices;
  }, [services, categoryId, priceRange, seats, selectedCity]);

  const isLoading = servicesLoading || settings.isSettingsLoading;

  // Special case for transport page layout
  if (categoryId === 'transport') {
      const renderTransportContent = () => {
          if (isLoading) {
              return (
                  <div className="container mx-auto px-4 max-w-4xl space-y-6">
                      <Skeleton className="h-64 w-full" />
                      <Skeleton className="h-10 w-1/2" />
                      <Skeleton className="h-20 w-full" />
                  </div>
              );
          }
          if (!category || !category.enabled) {
             return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Service Unavailable" message="This service category is currently disabled." />;
          }
          const hasServices = services && services.length > 0;
          if (!hasServices) {
            return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Service Available" message="This service is not available. Please check back later." />;
          }
      
          const allInactive = hasServices && services.every(s => s.isActive === false);
          if (allInactive) {
            return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Service Is Busy" message="This service is temporarily unavailable. We'll be back soon!" />;
          }

          const transportService = filteredServices[0] as Service | undefined;
          if (!transportService) {
              return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Active Service" message="Could not find an active transport service." />;
          }
          return <TransportPageContent service={transportService} />;
      };

      return (
          <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 flex items-center justify-center">
                  <div className="py-16 md:py-24">
                      {renderTransportContent()}
                  </div>
              </main>
              <Footer />
          </div>
      );
  }

  // Default layout for all other categories
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
    
    if (!category || !category.enabled) {
      return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Category Not Found" message="This service category is either disabled or does not exist." />;
    }

    const hasServices = services && services.length > 0;
    if (!hasServices) {
        return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Services Available" message="There are currently no services in this category. Please check back later." />;
    }

    const allInactive = hasServices && services.every(s => s.isActive === false);
    if (allInactive) {
        return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Services Are Busy" message="All services in this category are temporarily unavailable. We'll be back soon!" />;
    }
    
    if (filteredServices.length === 0) {
        return <p className="text-center text-lg text-foreground/80">No services match your current filters.</p>;
    }

    return <ServiceList services={filteredServices} />;
  };

  const PageIcon = category ? Icon : HelpCircle;
  const pageTitle = category?.name || "Services";
  const pageDescription = `Browse our selection of ${pageTitle.toLowerCase()}.`;
  const showFilters = !isLoading && category && category.enabled && services && services.length > 0 && !services.every(s => s.isActive === false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <PageIcon name={category?.icon || 'Compass'} className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                {pageDescription}
              </p>
            </div>
            
            {showFilters && categoryId === 'cars' && (
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
            
            {showFilters && categoryId === 'hotels' && (
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
            )}

            {renderContent()}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
