
'use client';

import Link from 'next/link';
import {
  Car,
  BedDouble,
  Briefcase,
  ArrowRight,
  Compass,
  Star,
} from 'lucide-react';
import type { Service } from '@/lib/types';
import ServiceList from '@/components/service-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageMessage from './page-message';

export default function BestServicesSection({ bestOffers, categorySettings }: { bestOffers: Service[], categorySettings: { [key: string]: boolean } }) {
  
  const bestCars = bestOffers.filter(s => s.category === 'cars');
  const bestHotels = bestOffers.filter(s => s.category === 'hotels');
  const bestTransports = bestOffers.filter(s => s.category === 'transport');
  const bestExplores = bestOffers.filter(s => s.category === 'explore');
  
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
          <TabsContent value="cars">
            {bestCars.length > 0 ? (
              <div className="space-y-8">
                <ServiceList services={bestCars.slice(0, 3)} />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/cars">
                      Show More Cars
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
               <p className="text-center text-lg text-foreground/80 py-8">No car rental offers are featured at the moment.</p>
            )}
          </TabsContent>
          <TabsContent value="hotels">
            {bestHotels.length > 0 ? (
              <div className="space-y-8">
                <ServiceList services={bestHotels.slice(0, 3)} />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/hotels">
                      Show More Hotels
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-lg text-foreground/80 py-8">No hotel offers are featured at the moment.</p>
            )}
          </TabsContent>
          <TabsContent value="transport">
            {bestTransports.length > 0 ? (
              <div className="space-y-8">
                <ServiceList services={bestTransports.slice(0, 3)} />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/transport">
                      View Details & Book
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
                <p className="text-center text-lg text-foreground/80 py-8">No transport offers are featured at the moment.</p>
            )}
          </TabsContent>
          <TabsContent value="explore">
            {bestExplores.length > 0 ? (
              <div className="space-y-8">
                <ServiceList services={bestExplores.slice(0, 3)} />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/explore">
                      Show More Trips
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
               <p className="text-center text-lg text-foreground/80 py-8">No 'Explore' offers are featured at the moment.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
