'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { services } from '@/lib/data';
import { BedDouble } from 'lucide-react';

export default function HotelsPage() {
  const hotelServices = services.filter(
    (service) => service.category === 'hotels'
  );

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
            <ServiceList services={hotelServices} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
