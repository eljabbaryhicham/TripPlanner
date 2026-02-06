'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/lib/types';
import ReservationFlow from './reservation-flow';

interface ServiceDetailModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceDetailModal = ({
  service,
  isOpen,
  onClose,
}: ServiceDetailModalProps) => {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="relative w-full aspect-[16/9] rounded-t-lg overflow-hidden -mt-6">
            <Image
              src={service.imageUrl}
              alt={service.description}
              fill
              className="object-cover"
              data-ai-hint={service.imageHint}
            />
          </div>
          <div className="pt-6">
            <DialogTitle className="text-3xl font-headline mb-2">
              {service.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              {service.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div>
            <h3 className="font-semibold mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(service.details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-foreground/80">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Location & Pricing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/80">Location:</span>
                <span className="font-medium">{service.location}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-foreground/80">Price:</span>
                <Badge variant="secondary" className="text-lg">
                  ${service.price} / {service.priceUnit}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <ReservationFlow service={service} />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailModal;
