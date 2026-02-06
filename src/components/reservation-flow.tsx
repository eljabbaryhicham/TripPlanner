'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, CreditCard, Send, Loader2 } from 'lucide-react';

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
import { Card, CardContent } from '@/components/ui/card';

const reservationSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().optional(),
  serviceName: z.string(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationFlowProps {
  service: Service;
}

const ReservationFlow = ({ service }: ReservationFlowProps) => {
  const [reservationType, setReservationType] = React.useState<
    'contact' | 'checkout' | null
  >(null);
  const { toast } = useToast();
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      serviceName: service.name,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ReservationFormValues) => {
    const result = await submitReservation(data);
    if (result.success) {
      toast({
        title: 'Message Sent!',
        description:
          "We've received your inquiry and will get back to you shortly.",
      });
      form.reset();
      setReservationType(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request. Please try again.',
      });
    }
  };

  if (reservationType === 'contact') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('serviceName')} />
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

  if (reservationType === 'checkout') {
    return (
      <Card className="text-center bg-secondary/50">
        <CardContent className="p-6">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold">Redirecting to Checkout</h3>
          <p className="text-sm text-muted-foreground">
            You will be redirected to our secure payment gateway to complete your
            reservation.
          </p>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReservationType(null)}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
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
        onClick={() => setReservationType('checkout')}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Checkout Now
      </Button>
    </div>
  );
};

export default ReservationFlow;
