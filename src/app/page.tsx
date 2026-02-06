'use client';

import * as React from 'react';
import {
  Car,
  BedDouble,
  Plane,
} from 'lucide-react';

import { bestOffers } from '@/lib/data';

import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import AiSuggestions from '@/components/ai-suggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative bg-primary/10 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              TriPlanner
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80 md:text-xl">
              Your ultimate travel planning assistant. Seamlessly book cars,
              hotels, and transport.
            </p>
          </div>
        </section>

        <AiSuggestions />

        <section id="services" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center font-headline text-3xl font-bold md:text-4xl">
              Best Service Offers
            </h2>
            <Tabs
              defaultValue="all"
              className="w-full"
            >
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
                  <Plane className="w-4 h-4 mr-2" />
                  Transport
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ServiceList services={bestOffers} />
              </TabsContent>
              <TabsContent value="cars">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'cars'
                  )}
                />
              </TabsContent>
              <TabsContent value="hotels">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'hotels'
                  )}
                />
              </TabsContent>
              <TabsContent value="transport">
                <ServiceList
                  services={bestOffers.filter(
                    (service) => service.category === 'transport'
                  )}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
