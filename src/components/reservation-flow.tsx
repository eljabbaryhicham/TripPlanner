
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp, doc, setDoc } from 'firebase/firestore';

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
import { submitInquiryEmail } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const reservationSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().optional(),
  message: z.string().optional(),
  serviceName: z.string(),
  serviceId: z.string(),
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
  fullName: string;
  origin?: string;
  destination?: string;
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


const ReservationFlow = ({ service, dates, totalPrice, fullName, origin, destination }: ReservationFlowProps) => {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [reservationType, setReservationType] = React.useState<'contact' | null>(null);
  const [showInquiryConfirmation, setShowInquiryConfirmation] = React.useState(false);
  const [showEmailSuccessDialog, setShowEmailSuccessDialog] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const isDateRequired = service.category === 'cars' || service.category === 'hotels' || service.category === 'transport';
  const isFlowDisabled = !fullName || (isDateRequired && !dates) || (service.category === 'transport' && !totalPrice);

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
      email: '',
      phone: '',
      message: '',
      serviceName: service.name,
      serviceId: service.id,
    },
  });
  
  const { isSubmitting } = form.formState;

  const onContactSubmit = async (data: ReservationFormValues) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Firestore is not initialized. Please try again later.',
      });
      return;
    }

    const inquiryDataForDb = {
      ...data,
      customerName: fullName,
      bookingMethod: 'email' as 'email' | 'whatsapp',
      startDate: dates?.from ? Timestamp.fromDate(dates.from) : null,
      endDate: dates?.to ? Timestamp.fromDate(dates.to) : null,
      origin: origin || null,
      destination: destination || null,
      totalPrice: totalPrice,
      createdAt: serverTimestamp(),
      status: 'pending',
      paymentStatus: 'unpaid',
    };

    try {
      const inquiriesCol = collection(firestore, 'inquiries');
      const docRef = await addDoc(inquiriesCol, { ...inquiryDataForDb });
      
      // Now that it's saved, send the email.
      const emailResult = await submitInquiryEmail({
        ...data,
        customerName: fullName,
        bookingMethod: 'email',
        startDate: dates?.from,
        endDate: dates?.to,
        origin,
        destination,
        totalPrice,
      });

      if (emailResult.success) {
         if (emailResult.warning) {
          toast({ title: "Inquiry Sent (with a note)", description: emailResult.warning, duration: 8000 });
        } else {
          toast({ title: 'Message Sent!', description: "We've received your message and will get back to you shortly (Within 1-3 Hours)." });
        }
        setShowEmailSuccessDialog(true);
      } else {
         toast({
          variant: 'destructive',
          title: 'Email Failed',
          description: emailResult.error || 'The inquiry was saved, but the email could not be sent.',
        });
      }

      form.reset();
      setShowInquiryConfirmation(true);
      setReservationType(null);

    } catch (error) {
        console.error("Failed to save inquiry to Firestore:", error);
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: "Your inquiry could not be saved to our system. Please try again later.",
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
        const reservationsCol = collection(firestore, 'users', user.uid, 'reservations');
        // Create a reference with a new ID first.
        const newReservationRef = doc(reservationsCol);
        
        const reservationPayload = {
            id: newReservationRef.id, // Use the generated ID in the document data.
            userId: user.uid,
            customerName: fullName,
            serviceType: service.category,
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            priceUnit: service.priceUnit,
            totalPrice: totalPrice ?? service.price,
            startDate: dates?.from ? Timestamp.fromDate(dates.from) : null,
            endDate: dates?.to ? Timestamp.fromDate(dates.to) : null,
            origin: origin || null,
            destination: destination || null,
            paymentStatus: 'pending',
            status: 'active',
            createdAt: serverTimestamp(),
        };

        // Use setDoc with the new ref to create the document.
        await setDoc(newReservationRef, reservationPayload);

        router.push(`/checkout/${newReservationRef.id}`);
    } catch (error: any) {
        console.error("Reservation creation failed:", error);
        toast({
            variant: 'destructive',
            title: 'Reservation Failed',
            description: 'Could not create your reservation. You may not have permissions.',
        });
    } finally {
        setIsCheckingOut(false);
    }
  };

  const whatsappMessage = React.useMemo(() => {
    let message = `Hello, I'd like to book the service: ${service.name}. My name is ${fullName}.`;
    if (dates?.from && dates.to) {
      message += ` From: ${dates.from.toLocaleDateString()} To: ${dates.to.toLocaleDateString()}.`;
    } else if (dates?.from) {
      message += ` For pickup on: ${dates.from.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`
    }
    if (origin && destination) {
        message += ` From: ${origin} To: ${destination}.`;
    }
    return encodeURIComponent(message);
  }, [service, dates, fullName, origin, destination]);

  const handleWhatsappBooking = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Firestore is not initialized. Please try again later.',
      });
      return;
    }

    const inquiryData = {
        customerName: fullName,
        serviceId: service.id,
        serviceName: service.name,
        bookingMethod: 'whatsapp' as const,
        startDate: dates?.from ? Timestamp.fromDate(dates.from) : null,
        endDate: dates?.to ? Timestamp.fromDate(dates.to) : null,
        origin: origin || null,
        destination: destination || null,
        totalPrice: totalPrice,
        email: '', // Not collected for WhatsApp booking
        createdAt: serverTimestamp(),
        status: 'pending',
        paymentStatus: 'unpaid',
    };

    try {
        const inquiriesCol = collection(firestore, 'inquiries');
        await addDoc(inquiriesCol, inquiryData);
        
        // Only open WhatsApp after successful save
        if (whatsappNumber && !isFlowDisabled) {
            window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${whatsappMessage}`, '_blank', 'noopener,noreferrer');
        }
    } catch (error) {
        console.error("Failed to save WhatsApp inquiry:", error);
        toast({
            variant: "destructive",
            title: "Action unavailable",
            description: "Could not log your inquiry before opening WhatsApp.",
        });
    }
  };



  if (showInquiryConfirmation) {
    return (
      <div className="text-center p-8 bg-green-50/50 rounded-lg border border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-xl font-semibold">Inquiry Sent!</h3>
        <p className="mt-2 text-muted-foreground">We've received your message and will get back to you shortly (Within 1-3 Hours). thanks</p>
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
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        <AlertDialog open={showEmailSuccessDialog} onOpenChange={setShowEmailSuccessDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Email Sent Successfully!</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your booking inquiry has been sent. We will contact you at your provided email address to confirm the details.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowEmailSuccessDialog(false)}>
                        Great!
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isCheckingOut || isUserLoading || isFlowDisabled}>
            {isCheckingOut ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <CreditCard className="mr-2 h-5 w-5" />
            )}
            {isUserLoading ? 'Initializing...' : isFlowDisabled ? 'Please provide all details' : 'Checkout Now'}
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
        <p className="text-center text-sm text-muted-foreground -mb-2">We will reply you in a few minutes.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
                className="w-full sm:flex-1"
                variant="secondary"
                onClick={() => setReservationType('contact')}
                disabled={isFlowDisabled}
            >
                <Send className="mr-2 h-4 w-4" />
                Book via Email
            </Button>
            <Button
                className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                disabled={!whatsappNumber || isFlowDisabled}
                onClick={handleWhatsappBooking}
            >
                <WhatsappIcon className="mr-2 h-5 w-5" />
                Book via Whatsapp
            </Button>
        </div>
    </div>
  );
};

export default ReservationFlow;




    