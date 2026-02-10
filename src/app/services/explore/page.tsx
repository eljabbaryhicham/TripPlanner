'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Compass, ServerCrash, Archive, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/components/settings-provider';
import PageMessage from '@/components/page-message';

export default function ExplorePage() {
  const firestore = useFirestore();
  const exploreTripsRef = useMemoFirebase(() => firestore ? collection(firestore, 'exploreTrips') : null, [firestore]);
  const { data: exploreServices, isLoading: servicesLoading } = useCollection(exploreTripsRef);
  
  const settings = useSettings();

  const activeExploreServices = React.useMemo(() => {
    return exploreServices?.filter(service => service.isActive !== false) ?? [];
  }, [exploreServices]);

  const isLoading = servicesLoading;

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
    
    if (settings.categories?.explore === false) {
      return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Service Unavailable" message="This service category is currently disabled. Please check back later." />;
    }

    const hasServices = exploreServices && exploreServices.length > 0;
    if (!hasServices) {
        return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Trips Available" message="There are currently no trips in this category. Please check back later." />;
    }

    const allInactive = hasServices && exploreServices.every(s => s.isActive === false);
    if (allInactive) {
        return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Trips Are Fully Booked" message="All trips in this category are temporarily unavailable. We'll be back soon with new adventures!" />;
    }
    
    if (activeExploreServices.length === 0) {
        return <p className="text-center text-lg text-foreground/80">No active trips available right now.</p>;
    }

    return <ServiceList services={activeExploreServices} />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Compass className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
                Explore Morocco
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
                Join our organized trips and discover the wonders of Morocco with fellow travelers.
              </p>
            </div>
            {renderContent()}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
