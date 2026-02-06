'use client';

import * as React from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import ReviewsPopup from './reviews-popup';

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
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [reviewsOpen, setReviewsOpen] = React.useState(false);

  const todayDate = React.useMemo(() => {
    const d = new Date();
    // Format to YYYY-MM-DD for the input min attribute
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const { days, totalPrice } = React.useMemo(() => {
    if (service && startDate && endDate) {
      try {
        const from = new Date(startDate);
        const to = new Date(endDate);

        if (to <= from) return { days: null, totalPrice: null };

        // The time difference in milliseconds
        const timeDiff = to.getTime() - from.getTime();
        
        // The difference in days, rounded to handle DST
        const dayDifference = Math.round(timeDiff / (1000 * 3600 * 24));

        let dayCount;
        if (service.priceUnit === 'night') {
          dayCount = dayDifference;
        } else { // for 'day' unit
          dayCount = dayDifference + 1;
        }

        if (dayCount > 0) {
          return { days: dayCount, totalPrice: dayCount * service.price };
        }
      } catch (e) {
        // Invalid date string
        return { days: null, totalPrice: null };
      }
    }
    return { days: null, totalPrice: null };
  }, [startDate, endDate, service]);

  const dateForFlow = React.useMemo(() => {
    if (!startDate || !endDate) return undefined;
    try {
        const from = new Date(startDate);
        const to = new Date(endDate);
        if (to <= from) return undefined;
        return { from, to };
    } catch(e) {
        return undefined;
    }
  }, [startDate, endDate]);


  React.useEffect(() => {
    if (!isOpen) {
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen]);

  if (!service) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="relative -mx-6 -mt-6 rounded-t-lg overflow-hidden">
              <Carousel>
                <CarouselContent>
                  <CarouselItem>
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={service.imageUrl}
                        alt={service.description}
                        fill
                        className="object-cover"
                        data-ai-hint={service.imageHint}
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src="https://picsum.photos/seed/media1/1280/720"
                        alt="Additional media 1"
                        fill
                        className="object-cover"
                        data-ai-hint="service amenity"
                      />
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src="https://picsum.photos/seed/media2/1280/720"
                        alt="Additional media 2"
                        fill
                        className="object-cover"
                        data-ai-hint="service view"
                      />
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
              </Carousel>
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
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-foreground/80">{key}:</span>
                    {key === 'Rating' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{value}</span>
                        <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setReviewsOpen(true)}>
                          Show Reviews
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{value}</span>
                    )}
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
                  {totalPrice !== null && days ? (
                    <div className="text-right">
                      <Badge variant="secondary" className="text-lg">
                        ${totalPrice.toFixed(2)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        (${service.price} / {service.priceUnit} for {days}{' '}
                        {days === 1
                          ? service.priceUnit === 'day'
                            ? 'day'
                            : 'night'
                          : service.priceUnit === 'day'
                          ? 'days'
                          : 'nights'}
                        )
                      </p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-lg">
                      ${service.price} / {service.priceUnit}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(service.category === 'cars' || service.category === 'hotels') && (
            <div className="space-y-4">
              <Label>Reservation Dates</Label>
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                      <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                      <Input 
                          id="start-date" 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                          min={todayDate}
                          className="bg-secondary/50 text-foreground"
                      />
                  </div>
                  <div className="grid gap-1.5">
                      <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                      <Input 
                          id="end-date" 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || todayDate}
                          className="bg-secondary/50 text-foreground"
                      />
                  </div>
              </div>
            </div>
          )}

          <Separator className="my-4" />
          <ReservationFlow
            service={service}
            dates={dateForFlow}
            totalPrice={totalPrice}
          />
        </DialogContent>
      </Dialog>
      {service && (
        <ReviewsPopup
          isOpen={reviewsOpen}
          onClose={() => setReviewsOpen(false)}
          serviceName={service.name}
        />
      )}
    </>
  );
};

export default ServiceDetailModal;
