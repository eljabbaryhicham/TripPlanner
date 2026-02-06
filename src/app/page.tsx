
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { getServices } from '@/lib/actions';

import Header from '@/components/header';
import AiSuggestions from '@/components/ai-suggestions';
import { Button } from '@/components/ui/button';
import BestServicesSection from '@/components/best-services-section';

export default async function Home() {
  const services = await getServices();
  const bestOffers = services.filter((service) => service.isBestOffer);

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

        <BestServicesSection bestOffers={bestOffers} />
      </main>
    </div>
  );
}
