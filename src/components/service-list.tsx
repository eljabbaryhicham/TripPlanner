'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Service } from '@/lib/types';
import ServiceCard from './service-card';
import ServiceDetailModal from './service-detail-modal';
import { slugify } from '@/lib/utils';

interface ServiceListProps {
  services: Service[];
}

const ServiceList = ({
  services,
}: ServiceListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedService = React.useMemo(() => {
    const serviceSlugs = services.map(s => slugify(s.name));
    for (const key of searchParams.keys()) {
      if (serviceSlugs.includes(key)) {
        return services.find(s => slugify(s.name) === key) ?? null;
      }
    }
    return null;
  }, [searchParams, services]);

  const handleClose = () => {
    // Using router.push to ensure a navigation event occurs and resets the URL.
    router.push(pathname, { scroll: false });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isBestOffer={service.isBestOffer}
          />
        ))}
      </div>
      <ServiceDetailModal
        key={selectedService?.id}
        service={selectedService}
        isOpen={!!selectedService}
        onClose={handleClose}
      />
    </>
  );
};

export default ServiceList;
