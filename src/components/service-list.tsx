'use client';

import * as React from 'react';
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
  const [selectedService, setSelectedService] = React.useState<Service | null>(
    null
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelect={setSelectedService}
            isBestOffer={showBestOfferBadge}
          />
        ))}
      </div>
      <ServiceDetailModal
        key={selectedService?.id}
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
      />
    </>
  );
};

export default ServiceList;
