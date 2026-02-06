'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, DollarSign, Star } from 'lucide-react';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { slugify } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  isBestOffer?: boolean;
}

const ServiceCard = ({
  service,
  isBestOffer = false,
}: ServiceCardProps) => {
  const pathname = usePathname();

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/2] w-full">
          {isBestOffer && (
            <Badge
              variant="default"
              className="absolute top-3 right-3 z-10 bg-accent text-accent-foreground"
            >
              <Star className="w-3 h-3 mr-1.5" />
              Best Offer
            </Badge>
          )}
          <Image
            src={service.imageUrl}
            alt={service.description}
            fill
            className="object-cover"
            data-ai-hint={service.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-grow">
          <CardTitle className="mb-2 text-xl font-headline">
            {service.name}
          </CardTitle>
          <div className="flex items-center text-sm text-foreground/80 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{service.location}</span>
          </div>
           <div className="flex items-baseline text-lg font-semibold">
            <DollarSign className="w-4 h-4 mr-1" />
            {service.price}
            <span className="text-sm font-normal text-foreground/60">
              /{service.priceUnit}
            </span>
          </div>
        </div>
        <Button asChild variant="default" className="w-full mt-4 h-14 text-lg font-bold">
            <Link href={`${pathname}?${slugify(service.name)}`} scroll={false}>
              Book
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
