
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';

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

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.89-5.451 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
);


const ReservationFlow = ({ service, dates, totalPrice }: ReservationFlowProps) => {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [reservationType, setReservationType] = React.useState<'contact' | null>(null);
  const [showInquiryConfirmation, setShowInquiryConfirmation] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

    React.useEffect(() => {
        fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
            }
        })
        .catch(console.error);
    }, []);

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

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    if (isUserLoading) {
        toast({ description: "User session is loading, please wait." });
        setIsCheckingOut(false);
        return;
    }

    if (!user) {
        toast({
            variant: "destructive",
            title: "You're not signed in.",
            description: "Please wait a moment for session initialization and try again.",
        });
        setIsCheckingOut(false);
        return;
    }
    
    if (!firestore) {
         toast({ variant: 'destructive', title: 'Database service is not ready.' });
        setIsCheckingOut(false);
        return;
    }
    
    try {
        const reservationsCol = collection(firestore, 'reservations');
        
        const reservationPayload = {
            userId: user.uid,
            serviceType: service.category,
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            priceUnit: service.priceUnit,
            totalPrice: totalPrice ?? service.price,
            startDate: dates?.from ? Timestamp.fromDate(dates.from) : new Date(),
            endDate: dates?.to ? Timestamp.fromDate(dates.to) : new Date(),
            paymentStatus: 'pending',
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(reservationsCol, reservationPayload);
        router.push(`/checkout/${docRef.id}`);
    } catch (error: any) {
        console.error('Failed to create reservation:', error);
        toast({
            variant: 'destructive',
            title: 'Reservation Failed',
            description: error.message || 'Could not create your reservation. Please try again.',
        });
    } finally {
        setIsCheckingOut(false);
    }
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
    <div className="space-y-4">
        <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isCheckingOut || isUserLoading}>
            {isCheckingOut ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <CreditCard className="mr-2 h-5 w-5" />
            )}
            {isUserLoading ? 'Initializing...' : 'Checkout Now'}
        </Button>
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    Or book manually
                </span>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
                className="w-full sm:flex-1"
                variant="secondary"
                onClick={() => setReservationType('contact')}
            >
                <Send className="mr-2 h-4 w-4" />
                Book via Email
            </Button>
            <Button
                asChild
                className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                disabled={!whatsappNumber}
            >
                <a href={`https://wa.me/${whatsappNumber.replace(/\\+/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon className="mr-2 h-5 w-5" />
                    Book via Whatsapp
                </a>
            </Button>
        </div>
    </div>
  );
};

export default ReservationFlow;
