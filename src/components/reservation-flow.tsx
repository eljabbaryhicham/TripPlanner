'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreditCard, Send, Loader2, CheckCircle } from 'lucide-react';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitReservation } from '@/lib/actions';

const reservationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
  price: z.number(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

// Define DateRange locally to avoid dependency on react-day-picker
type DateRange = {
    from: Date | undefined;
    to?: Date | undefined;
};

interface ReservationFlowProps {
  service: Service;
  dates: DateRange | undefined;
  totalPrice: number | null;
}

const ReservationFlow = ({ service, dates, totalPrice }: ReservationFlowProps) => {
  const [reservationType, setReservationType] = React.useState<'contact' | null>(null);
  const [showInquiryConfirmation, setShowInquiryConfirmation] = React.useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      serviceName: service.name,
      serviceId: service.id,
      price: service.price,
    },
  });

  const { isSubmitting } = form.formState;

  const onContactSubmit = async (data: ReservationFormValues) => {
    const result = await submitReservation(data);
    if (result.success) {
      toast({
        title: 'Message Sent!',
        description:
          "We've received your inquiry and will get back to you shortly.",
      });
      form.reset();
      setShowInquiryConfirmation(true);
      setReservationType(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request. Please try again.',
      });
    }
  };

  const onCheckout = () => {
    if ((service.category === 'cars' || service.category === 'hotels')) {
        if (!dates || !dates.from || !dates.to) {
            toast({
                variant: 'destructive',
                title: 'Select Dates',
                description: 'Please select a start and end date for your reservation.',
            });
            return;
        }
        if (totalPrice === null || totalPrice <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Date Range',
                description: `Please select a valid range. A booking must be for at least one ${service.priceUnit}.`,
            });
            return;
        }
    }

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Database service is not available. Please try again later.',
      });
      return;
    }

    const userId = user?.uid || 'anonymous';
    const reservationData = {
      userId,
      serviceType: service.category,
      serviceId: service.id,
      serviceName: service.name,
      totalPrice: totalPrice || service.price,
      priceUnit: service.priceUnit,
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      startDate: dates?.from?.toISOString() || new Date().toISOString(),
      endDate: dates?.to?.toISOString() || new Date().toISOString(),
    };

    const reservationsCol = collection(firestore, 'reservations');
    
    toast({
      title: 'Creating Reservation...',
      description: 'Please wait while we prepare your checkout.',
    });

    addDocumentNonBlocking(reservationsCol, reservationData)
      .then(docRef => {
        if (docRef) {
          router.push(`/checkout/${docRef.id}`);
        } else {
          // This case might happen if the non-blocking function fails early,
          // though the .catch in it should handle permissions errors.
          throw new Error('Failed to create reservation document.');
        }
      })
      .catch(error => {
        console.error("Error creating reservation or redirecting:", error);
        toast({
          variant: 'destructive',
          title: 'Checkout Failed',
          description: 'Could not create a reservation to proceed to checkout.',
        });
      });
  };
  
  if (showInquiryConfirmation) {
    return (
      <div className="text-center p-8 bg-green-50/50 rounded-lg border border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-xl font-semibold">Inquiry Sent!</h3>
        <p className="mt-2 text-muted-foreground">We've received your message and will get back to you shortly.</p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setShowInquiryConfirmation(false);
          }}
        >
          Done
        </Button>
      </div>
    );
  }

  if (reservationType === 'contact') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onContactSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('serviceName')} />
          <input type="hidden" {...form.register('serviceId')} />
          <input type="hidden" {...form.register('price')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any questions or special requests?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReservationType(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Inquiry
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <Button
        className="flex-1"
        variant="secondary"
        onClick={() => setReservationType('contact')}
      >
        <Send className="mr-2 h-4 w-4" />
        Contact for Info
      </Button>
      <Button
        className="flex-1"
        variant="default"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
        onClick={onCheckout}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Proceed to Checkout
      </Button>
    </div>
  );
};

export default ReservationFlow;
