'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Star,
  ServerCrash,
  Archive,
} from 'lucide-react';
import type { Service } from '@/lib/types';
import ServiceList from '@/components/service-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageMessage from './page-message';
import { useSettings } from './settings-provider';
import { Icon } from './icon';

interface BestServicesSectionProps {
  allServices: Service[];
}

export default function BestServicesSection({ allServices }: BestServicesSectionProps) {
  const { categories: categorySettings } = useSettings();
  
  const activeCategories = categorySettings.filter(c => c.enabled);
  
  const activeServices = allServices.filter(s => {
    const category = activeCategories.find(c => c.id === s.category);
    return s.isActive !== false && category;
  });

  const bestOffers = activeServices.filter((service) => service.isBestOffer);

  const renderCategoryContent = (
    bestOffersForCategory: Service[], 
    categoryName: string
  ) => {
    const category = activeCategories.find(c => c.id === categoryName);
    if (!category) return null;

    const servicesForCategory = allServices.filter(s => s.category === categoryName);
    const hasServices = servicesForCategory && servicesForCategory.length > 0;
    const allInactive = hasServices && servicesForCategory.every(s => s.isActive === false);

    if (!hasServices) {
      return <PageMessage icon={<Archive className="h-10 w-10 text-primary" />} title={`No ${category.name} Available`} message={`There are currently no services in this category. Please check back later.`} />;
    }

    if (allInactive) {
      return <PageMessage icon={<ServerCrash className="h-10 w-10 text-primary" />} title={`${category.name} Are Busy`} message={`All services in this category are temporarily unavailable. We'll be back soon!`} />;
    }
    
    if (bestOffersForCategory.length === 0) {
      return <PageMessage icon={<Star className="h-10 w-10 text-primary" />} title="No Special Offers" message={`There are no featured best offers for ${category.name} at the moment.`} />;
    }

    return (
      <div className="space-y-8">
        <ServiceList services={bestOffersForCategory.slice(0, 3)} />
        <div className="text-center">
          <Button asChild variant="outline">
            <Link href={category.href}>
              Show More {category.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4">
      <h2 className="mb-12 text-center font-headline text-3xl font-bold md:text-4xl">
        Best Service Offers
      </h2>
      {bestOffers.length === 0 ? (
        <PageMessage icon={<Star className="h-10 w-10 text-primary" />} title="No Special Offers" message="There are no featured best offers at the moment. Please check out our individual service pages!" />
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-center w-full max-w-lg mx-auto mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            {activeCategories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                <Icon name={cat.icon} className="h-[17px] w-[17px] text-[17px] mr-2" />
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all">
            <ServiceList services={bestOffers.slice(0, 3)} />
          </TabsContent>
          {activeCategories.map(cat => (
            <TabsContent key={cat.id} value={cat.id}>
              {renderCategoryContent(
                  bestOffers.filter(s => s.category === cat.id), 
                  cat.id
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
