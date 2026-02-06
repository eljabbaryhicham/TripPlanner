'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { services } from '@/lib/data';
import { Plane } from 'lucide-react';

export default function TransportPage() {
  const transportServices = services.filter(
    (service) => service.category === 'transport'
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Plane className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                Transport Services
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                Get from A to B with ease and comfort.
              </p>
            </div>
            <ServiceList services={transportServices} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
