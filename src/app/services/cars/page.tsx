
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { getServices } from '@/lib/actions';
import { Car } from 'lucide-react';

export default async function CarsPage() {
  const allServices = await getServices();
  const carServices = allServices.filter((service) => service.category === 'cars');

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
            <ServiceList services={carServices} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
