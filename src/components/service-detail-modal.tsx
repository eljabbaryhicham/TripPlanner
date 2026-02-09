
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
import type { Service, Review } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Star } from 'lucide-react';

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
  const [fullName, setFullName] = React.useState('');
  const [reviewsOpen, setReviewsOpen] = React.useState(false);
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(
    () => service ? query(collection(firestore, 'reviews'), where('serviceId', '==', service.id)) : null,
    [firestore, service]
  );
  
  const { data: reviews, isLoading: reviewsLoading } = useCollection<Review>(reviewsQuery);
  
  const { averageRating, totalReviews } = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return { averageRating: 0, totalReviews: 0 };
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
        averageRating: total / reviews.length,
        totalReviews: reviews.length
    };
  }, [reviews]);

  const todayDate = React.useMemo(() => {
    const d = new Date();
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

        const timeDiff = to.getTime() - from.getTime();
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
      setFullName('');
    }
  }, [isOpen]);

  if (!service) return null;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="relative -mx-6 -mt-6 rounded-t-lg overflow-hidden p-4 bg-muted/40">
              <Carousel>
                <CarouselContent>
                  <CarouselItem>
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={service.imageUrl}
                        alt={service.description}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  </CarouselItem>
                  {service.additionalMedia?.map((media, index) => (
                    <CarouselItem key={index}>
                        <div className="relative aspect-[16/9] w-full">
                        <Image
                            src={media.imageUrl}
                            alt={media.description}
                            fill
                            className="object-cover rounded-md"
                        />
                        </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
              </Carousel>
            </div>
          </DialogHeader>

          <div className="px-6 pt-6">
            <div className="pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <DialogTitle className="text-3xl font-headline mb-2 sm:mb-0">
                  {service.name}
                </DialogTitle>
                {totalReviews > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center text-amber-400">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            <span>{averageRating.toFixed(1)}</span>
                        </span>
                        <span>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                )}
              </div>
              <DialogDescription className="text-base mt-2">
                {service.description}
              </DialogDescription>
              <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setReviewsOpen(true)}>
                Show Reviews
              </Button>
            </div>
          </div>

          <Separator />
          
           <div className="px-6 pt-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Details</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(service.details)
                    .filter(([key]) => key.toLowerCase() !== 'rating')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
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
          </div>

          <Separator />

          <div className="px-6 pt-6 pb-6">
            <div className="space-y-4 mb-6">
                <Label htmlFor="full-name" className="font-semibold">Your Full Name</Label>
                <Input 
                    id="full-name"
                    placeholder="Enter your full name to proceed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />
            </div>
            {(service.category === 'cars' || service.category === 'hotels') && (
              <div className="space-y-4 mb-6">
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
                            disabled={!fullName}
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
                            disabled={!fullName || !startDate}
                        />
                    </div>
                </div>
              </div>
            )}
            <ReservationFlow
              service={service}
              dates={dateForFlow}
              totalPrice={totalPrice}
              fullName={fullName}
            />
          </div>

        </DialogContent>
      </Dialog>
      {service && (
        <ReviewsPopup
          isOpen={reviewsOpen}
          onClose={() => setReviewsOpen(false)}
          serviceId={service.id}
          serviceName={service.name}
          reviews={reviews}
          averageRating={averageRating}
          isLoading={reviewsLoading}
        />
      )}
    </>
  );
};

export default ServiceDetailModal;
