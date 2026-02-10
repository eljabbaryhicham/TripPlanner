'use client';

import * as React from 'react';
import type { Review, Service } from '@/lib/types';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReservationFlow from '@/components/reservation-flow';
import ReviewsPopup from '@/components/reviews-popup';
import { Star } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOROCCAN_CITIES, AIRPORTS } from '@/lib/constants';
import { getTransportPrice } from '@/lib/utils';


export default function TransportPageContent({ service }: { service: Service }) {
  const [reviewsOpen, setReviewsOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const firestore = useFirestore();
  
  const [fromAirport, setFromAirport] = React.useState('');
  const [toCity, setToCity] = React.useState('');
  const [pickupDate, setPickupDate] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('');
  
  const calculatedPrice = React.useMemo(() => getTransportPrice(fromAirport, toCity), [fromAirport, toCity]);
  
  const pickupDateTime = React.useMemo(() => {
    if (pickupDate && pickupTime) {
      try {
        return new Date(`${pickupDate}T${pickupTime}`);
      } catch (e) {
        console.error("Invalid date/time for pickup", e);
        return undefined;
      }
    }
    return undefined;
  }, [pickupDate, pickupTime]);

  const dateForFlow = React.useMemo(() => {
    if (!pickupDateTime) return undefined;
    return { from: pickupDateTime };
  }, [pickupDateTime]);


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

  return (
    <>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="relative -mx-0 -mt-0 rounded-t-lg overflow-hidden p-4 bg-muted/40">
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
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-primary/50 text-primary-foreground hover:bg-primary/80 border-0" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-primary/50 text-primary-foreground hover:bg-primary/80 border-0" />
              </Carousel>
          </div>

          <div className="p-6">
            <div className="pt-6 text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-headline mb-2 flex items-center">
                    {service.name}
                    {service.isBestOffer && (
                        <Badge variant="default" className="ml-4 bg-accent text-accent-foreground">
                            <Star className="w-3 h-3 mr-1.5" />
                            Best Offer
                        </Badge>
                    )}
                </h1>
                  {totalReviews > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center text-amber-400">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            <span>{averageRating.toFixed(1)}</span>
                        </span>
                        <span>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                )}
              </div>
              <p className="text-base text-muted-foreground mt-2">
                {service.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
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
                        <div className="flex justify-between items-center">
                            <span className="text-foreground/80">Reviews:</span>
                            <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setReviewsOpen(true)}>
                                Show Reviews
                            </Button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-3">Calculate Your Trip Price</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="from-airport">From</Label>
                            <Select value={fromAirport} onValueChange={setFromAirport}>
                                <SelectTrigger id="from-airport">
                                    <SelectValue placeholder="Select an airport" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AIRPORTS.map(airport => (
                                        <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to-city">To</Label>
                            <Select value={toCity} onValueChange={setToCity} disabled={!fromAirport}>
                                <SelectTrigger id="to-city">
                                    <SelectValue placeholder="Select a destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOROCCAN_CITIES.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-baseline">
                            <span className="text-foreground/80">Estimated Price:</span>
                            {calculatedPrice !== null ? (
                                <Badge variant="secondary" className="text-lg">
                                    ${calculatedPrice} / trip
                                </Badge>
                            ) : (
                                <span className="text-sm text-muted-foreground">Select route to see price</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-4 mb-6">
                <h3 className="font-semibold">Pickup Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pickup-date">Date</Label>
                        <Input 
                            id="pickup-date"
                            type="date" 
                            value={pickupDate} 
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={todayDate}
                            disabled={!fromAirport || !toCity}
                            className="bg-secondary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pickup-time">Time</Label>
                        <Input 
                            id="pickup-time"
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            disabled={!pickupDate}
                            className="bg-secondary/50"
                        />
                    </div>
                </div>
            </div>

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
            <ReservationFlow
                service={service}
                dates={dateForFlow}
                totalPrice={calculatedPrice}
                fullName={fullName}
                origin={fromAirport}
                destination={toCity}
            />
          </div>
        </div>
      </div>
      <ReviewsPopup
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        serviceId={service.id}
        serviceName={service.name}
        reviews={reviews}
        averageRating={averageRating}
        isLoading={reviewsLoading}
      />
    </>
  );
}
