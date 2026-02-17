
'use client';

import * as React from 'react';
import Link from 'next/link';
import Header from '@/components/header';
import AiSuggestions from '@/components/ai-suggestions';
import BestServicesSection from '@/components/best-services-section';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/components/settings-provider';
import CategorySlideshow from '@/components/category-slideshow';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import Footer from '@/components/footer';
import { CategoryServiceLoader } from '@/components/category-service-loader';
import type { Service } from '@/lib/types';

export default function Home() {
  const settings = useSettings();
  const enabledCategories = settings.categories.filter(cat => cat.enabled);
  const isSettingsLoading = settings.isSettingsLoading;

  const [serviceData, setServiceData] = React.useState<Record<string, { services: Service[] | null, isLoading: boolean }>>({});

  const handleDataLoaded = React.useCallback((categoryId: string, services: Service[] | null, isLoading: boolean) => {
    setServiceData(prev => ({
      ...prev,
      [categoryId]: { services, isLoading }
    }));
  }, []);

  const allServices = React.useMemo(() => {
    const combinedServices: Service[] = [];
    for (const categoryId in serviceData) {
      const { services } = serviceData[categoryId];
      if (services) {
        const servicesWithCategory = services.map(s => ({ ...s, category: categoryId }));
        combinedServices.push(...servicesWithCategory);
      }
    }
    return combinedServices;
  }, [serviceData]);

  const isLoading = React.useMemo(() => {
    if (isSettingsLoading) return true;
    
    const expectedCategoryIds = enabledCategories.map(c => c.id);
    if(expectedCategoryIds.length === 0) return false; // Not loading if there are no categories

    const loadedCategoryIds = Object.keys(serviceData);
    if (loadedCategoryIds.length < expectedCategoryIds.length) return true;

    return Object.values(serviceData).some(data => data.isLoading);
  }, [serviceData, enabledCategories, isSettingsLoading]);
  
  const renderBestServices = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 space-y-8">
            <Skeleton className="h-10 w-1/3 mx-auto" />
            <Skeleton className="h-10 w-2/3 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
      );
    }
    
    return <BestServicesSection allServices={allServices} />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {!isSettingsLoading && enabledCategories.map(cat => (
        <CategoryServiceLoader key={cat.id} categoryId={cat.id} onDataLoaded={handleDataLoaded} />
      ))}
      <Header />
      <main className="flex-1">
        <section
          className="relative flex min-h-screen flex-col items-center justify-between pt-24 bg-background"
          style={!isSettingsLoading && settings.heroBackgroundImageUrl ? {
            backgroundImage: `url('${settings.heroBackgroundImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          {!isSettingsLoading && settings.heroBackgroundImageUrl && <div className="absolute inset-0 bg-black/70" />}
          
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4 text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white">
                TriPlanner
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90 md:text-xl">
                Your ultimate travel planning assistant. Discover and book your next adventure.
              </p>
            </div>
            <div className="w-full mt-8">
              <CategorySlideshow />
            </div>
          </div>

          <div className="relative z-10 text-center pb-28 sm:pb-32">
            <p className="mb-4 font-handwriting text-2xl sm:text-3xl text-white/90">Explore Our Best Services</p>
            <Link href="#best-services" scroll={true}>
              <Button
                variant="outline"
                className="rounded-full h-12 w-12 sm:h-14 sm:w-14 p-0 bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm animate-bounce text-white"
              >
                <span className="sr-only">Scroll to next section</span>
                <ArrowDown className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </section>

        <section
          id="best-services"
          className="py-20 sm:py-24 md:py-32"
        >
          {renderBestServices()}
        </section>
        
         <section
          className="relative min-h-[50vh] flex flex-col text-white"
        >
          <div className="flex-grow flex items-center justify-center">
             <AiSuggestions />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
