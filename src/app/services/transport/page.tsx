'use client';

import * as React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { services } from '@/lib/data';
import type { Service } from '@/lib/types';
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

export default function TransportPage() {
  const [reviewsOpen, setReviewsOpen] = React.useState(false);

  const service: Service | undefined = services.find(
    (s) => s.category === 'transport'
  );
  
  if (!service) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Service not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="relative -mx-0 -mt-0 rounded-t-lg overflow-hidden">
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
                      {service.additionalMedia?.map((media, index) => (
                        <CarouselItem key={index}>
                            <div className="relative aspect-[16/9] w-full">
                            <Image
                                src={media.imageUrl}
                                alt={media.description}
                                fill
                                className="object-cover"
                                data-ai-hint={media.imageHint}
                            />
                            </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                  </Carousel>
              </div>

              <div className="p-6">
                <div className="pt-6 text-center md:text-left">
                  <h1 className="text-3xl font-headline mb-2 flex items-center">
                    {service.name}
                    {service.isBestOffer && (
                        <Badge variant="default" className="ml-4 bg-accent text-accent-foreground">
                            <Star className="w-3 h-3 mr-1.5" />
                            Best Offer
                        </Badge>
                    )}
                  </h1>
                  <p className="text-base text-muted-foreground">
                    {service.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
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
                        <Badge variant="secondary" className="text-lg">
                            ${service.price} / {service.priceUnit}
                        </Badge>
                        </div>
                    </div>
                    </div>
                </div>

                <Separator className="my-4" />
                <ReservationFlow
                    service={service}
                    dates={undefined}
                    totalPrice={null}
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
      <ReviewsPopup
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        serviceName={service.name}
      />
    </>
  );
}
