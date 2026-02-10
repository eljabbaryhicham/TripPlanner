
'use client';

import Link from 'next/link';
import {
  Car,
  BedDouble,
  Briefcase,
  ArrowRight,
  Compass,
  Star,
  ServerCrash,
  Archive,
} from 'lucide-react';
import type { Service } from '@/lib/types';
import ServiceList from '@/components/service-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageMessage from './page-message';

interface BestServicesSectionProps {
  allServices: Service[];
  categoryServices: {
    carRentals: Service[] | null;
    hotels: Service[] | null;
    transports: Service[] | null;
    exploreTrips: Service[] | null;
  };
  categorySettings: { [key: string]: boolean };
}

export default function BestServicesSection({ allServices, categoryServices, categorySettings }: BestServicesSectionProps) {
  
  const activeServices = allServices.filter(s => s.isActive !== false);

  const bestOffers = activeServices.filter((service) => {
    const isBest = service.isBestOffer;
    const isCategoryActive = categorySettings ? categorySettings[service.category] !== false : true;
    return isBest && isCategoryActive;
  });

  const bestCars = bestOffers.filter(s => s.category === 'cars');
  const bestHotels = bestOffers.filter(s => s.category === 'hotels');
  const bestTransports = bestOffers.filter(s => s.category === 'transport');
  const bestExplores = bestOffers.filter(s => s.category === 'explore');

  // Overall checks for the whole section
  if (allServices.length === 0) {
    return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Services Available" message="There are currently no services listed on our platform. Please check back later." />;
  }

  if (activeServices.length === 0) {
    return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Services Are Busy" message="All of our services are temporarily unavailable. We'll be back soon!" />;
  }
  
  const renderCategoryContent = (
    servicesForCategory: Service[] | null, 
    bestOffersForCategory: Service[], 
    categoryName: 'cars' | 'hotels' | 'transport' | 'explore'
  ) => {
    const hasServices = servicesForCategory && servicesForCategory.length > 0;
    const allInactive = hasServices && servicesForCategory.every(s => s.isActive === false);

    if (!hasServices) {
      return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title={`No ${categoryName} Available`} message={`There are currently no services in this category. Please check back later.`} />;
    }

    if (allInactive) {
      return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title={`${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Are Busy`} message={`All services in this category are temporarily unavailable. We'll be back soon!`} />;
    }
    
    if (bestOffersForCategory.length === 0) {
      return <PageMessage icon={<Star className="h-10 w-10 text-primary" />} title="No Special Offers" message={`There are no featured best offers for ${categoryName} at the moment.`} />;
    }

    return (
      <div className="space-y-8">
        <ServiceList services={bestOffersForCategory.slice(0, 3)} />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href={`/services/${categoryName}`}>
              Show More {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4">
      <h2 className="mb-12 text-center font-headline text-3xl font-bold md:text-4xl">
        Best Service Offers
      </h2>
      {bestOffers.length === 0 ? (
        <PageMessage icon={<Star className="h-10 w-10 text-primary" />} title="No Special Offers" message="There are no featured best offers at the moment. Please check out our individual service pages!" />
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-center w-full max-w-lg mx-auto mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {categorySettings.cars !== false && (
              <TabsTrigger value="cars">
                <Car className="w-4 h-4 mr-2" />
                Cars
              </TabsTrigger>
            )}
            {categorySettings.hotels !== false && (
              <TabsTrigger value="hotels">
                <BedDouble className="w-4 h-4 mr-2" />
                Hotels
              </TabsTrigger>
            )}
            {categorySettings.transport !== false && (
              <TabsTrigger value="transport">
                <Briefcase className="w-4 h-4 mr-2" />
                Pickup
              </TabsTrigger>
            )}
            {categorySettings.explore !== false && (
              <TabsTrigger value="explore">
                <Compass className="w-4 h-4 mr-2" />
                Explore
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="all">
            <ServiceList services={bestOffers.slice(0, 3)} />
          </TabsContent>
          {categorySettings.cars !== false && (
            <TabsContent value="cars">
              {renderCategoryContent(categoryServices.carRentals, bestCars, 'cars')}
            </TabsContent>
          )}
          {categorySettings.hotels !== false && (
            <TabsContent value="hotels">
              {renderCategoryContent(categoryServices.hotels, bestHotels, 'hotels')}
            </TabsContent>
          )}
          {categorySettings.transport !== false && (
            <TabsContent value="transport">
              {renderCategoryContent(categoryServices.transports, bestTransports, 'transport')}
            </TabsContent>
          )}
          {categorySettings.explore !== false && (
            <TabsContent value="explore">
              {renderCategoryContent(categoryServices.exploreTrips, bestExplores, 'explore')}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
