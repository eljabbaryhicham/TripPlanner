'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Car,
  BedDouble,
  Briefcase,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

import { bestOffers } from '@/lib/data';

import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import AiSuggestions from '@/components/ai-suggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function Home() {
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
                  <ServiceList services={bestOffers} />
                </TabsContent>
                <TabsContent value="cars">
                  <div className="space-y-8">
                    <ServiceList
                      services={bestOffers.filter(
                        (service) => service.category === 'cars'
                      )}
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
                      )}
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
                      )}
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
      </main>
    </div>
  );
}
