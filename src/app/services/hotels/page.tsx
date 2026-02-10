'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ServiceList from '@/components/service-list';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { BedDouble, ServerCrash, Archive, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MOROCCAN_CITIES } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PageMessage = ({ icon, title, message }: { icon: React.ReactNode, title: string, message: string }) => (
    <div className="text-center py-20 space-y-4">
        <div className="inline-block p-4 bg-muted rounded-full">
            {icon}
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-foreground/80 max-w-md mx-auto">{message}</p>
    </div>
);

export default function HotelsPage() {
  const firestore = useFirestore();
  const hotelsRef = useMemoFirebase(() => firestore ? collection(firestore, 'hotels') : null, [firestore]);
  const { data: hotelServices, isLoading: servicesLoading } = useCollection(hotelsRef);
  
  const [settings, setSettings] = React.useState<{ categories?: { hotels?: boolean } }>({});
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [selectedCity, setSelectedCity] = React.useState('all');

  React.useEffect(() => {
      fetch('/api/settings')
          .then(res => res.json())
          .then(data => setSettings(data))
          .catch(console.error)
          .finally(() => setSettingsLoading(false));
  }, []);
  
  const filteredHotels = React.useMemo(() => {
    let activeServices = hotelServices?.filter(service => service.isActive !== false) ?? [];
    if (selectedCity === 'all') {
      return activeServices;
    }
    return activeServices.filter(hotel => hotel.location === selectedCity);
  }, [hotelServices, selectedCity]);

  const isLoading = servicesLoading || settingsLoading;

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
    
    if (settings.categories?.hotels === false) {
      return <PageMessage icon={<AlertTriangle className="h-10 w-10 text-primary" />} title="Service Unavailable" message="This service category is currently disabled. Please check back later." />;
    }

    const hasServices = hotelServices && hotelServices.length > 0;
    if (!hasServices) {
        return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title="No Hotels Available" message="There are currently no hotels in this category. Please check back later." />;
    }

    const allInactive = hasServices && hotelServices.every(s => s.isActive === false);
    if (allInactive) {
        return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title="Hotels Are Fully Booked" message="All hotels in this category are temporarily unavailable. We'll be back soon!" />;
    }
    
    if (filteredHotels.length === 0) {
        return <p className="text-center text-lg text-foreground/80">No hotels match your current filter.</p>;
    }

    return <ServiceList services={filteredHotels} />;
  };

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
            
            {settings.categories?.hotels !== false && hotelServices && hotelServices.length > 0 && (
              <div className="mb-8 flex justify-center">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {MOROCCAN_CITIES.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {renderContent()}

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
