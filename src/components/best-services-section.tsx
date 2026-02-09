
'use client';

import Link from 'next/link';
import {
  Car,
  BedDouble,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import type { Service } from '@/lib/types';
import ServiceList from '@/components/service-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Footer from '@/components/footer';

export default function BestServicesSection({ bestOffers }: { bestOffers: Service[] }) {
  return (
    <section
      id="best-services"
      className="flex min-h-screen snap-start flex-col"
    >
      <div className="flex flex-1 items-center">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-headline text-3xl font-bold md:text-4xl">
            Best Service Offers
          </h2>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cars">
                <Car className="w-4 h-4 mr-2" />
                Cars
              </TabsTrigger>
              <TabsTrigger value="hotels">
                <BedDouble className="w-4 h-4 mr-2" />
                Hotels
              </TabsTrigger>
              <TabsTrigger value="transport">
                <Briefcase className="w-4 h-4 mr-2" />
                Pickup
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ServiceList services={bestOffers.slice(0, 3)} />
            </TabsContent>
            <TabsContent value="cars">
              <div className="space-y-8">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'cars'
                  ).slice(0, 3)}
                />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/cars">
                      Show More Cars
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="hotels">
              <div className="space-y-8">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'hotels'
                  ).slice(0, 3)}
                />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/hotels">
                      Show More Hotels
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="transport">
              <div className="space-y-8">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'transport'
                  ).slice(0, 3)}
                />
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/services/transport">
                      View Details & Book
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </section>
  );
}
