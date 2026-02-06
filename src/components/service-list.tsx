'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Service } from '@/lib/types';
import ServiceCard from './service-card';
import ServiceDetailModal from './service-detail-modal';

interface ServiceListProps {
  services: Service[];
  showBestOfferBadge?: boolean;
}

const ServiceList = ({
  services,
  showBestOfferBadge = false,
}: ServiceListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get('service');

  const selectedService = React.useMemo(() => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId) ?? null;
  }, [serviceId, services]);

  const handleClose = () => {
    router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isBestOffer={showBestOfferBadge}
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
