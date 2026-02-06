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
import { differenceInDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  const [date, setDate] = React.useState<DateRange | undefined>();

  // Memoize today's date to prevent creating it on every render, ensuring stability.
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);


  const { days, totalPrice } = React.useMemo(() => {
    if (service && date?.from && date?.to) {
      let dayCount;
      // For hotels, we count nights (exclusive end date).
      if (service.priceUnit === 'night') {
        dayCount = differenceInDays(date.to, date.from);
      } else { // For cars, we count days (inclusive).
        dayCount = differenceInDays(date.to, date.from) + 1;
      }
      
      // Ensure the duration is valid before calculating a price.
      if (dayCount > 0) {
        return { days: dayCount, totalPrice: dayCount * service.price };
      }
    }
    // If no valid date range is selected, return null for days and totalPrice.
    return { days: null, totalPrice: null };
  }, [date, service]);

  React.useEffect(() => {
    // Reset date when service or modal state changes
    if (isOpen) {
        setDate(undefined);
    }
  }, [service, isOpen]);


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
          <div className="grid gap-2">
            <Label htmlFor="date">Reservation Dates</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  disabled={(day) => day < today}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Separator className="my-4" />
        <ReservationFlow service={service} dates={date} totalPrice={totalPrice} />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailModal;
