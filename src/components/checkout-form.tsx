'use client';

import * as React from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentReference } from 'firebase/firestore';
import { Loader2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// Replace with your actual publishable key from Vercel Environment Variables.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
  reservation: {
    totalPrice: number;
    paymentStatus: string;
  };
  reservationRef: DocumentReference | null;
}

const PaymentForm = ({ reservation, reservationRef }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || !reservationRef) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
       toast({
        variant: "destructive",
        title: "Payment system not ready",
        description: "Please wait a moment for the payment system to load and try again.",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    // --- TODO: Step 1: Create a PaymentIntent on your backend ---
    // In a real application, you would make a request to your own server
    // to create a PaymentIntent. This server-side endpoint would use your
    // Stripe secret key to communicate with the Stripe API.
    //
    // Example:
    // const response = await fetch('/api/create-payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount: reservation.totalPrice * 100 }), // Amount in cents
    // });
    // const { clientSecret } = await response.json();
    //
    // Since we cannot create a backend here, this call will fail.
    // To make this work, you need to:
    // 1. Create a Next.js API route (e.g., `src/app/api/create-payment-intent/route.ts`).
    // 2. In that route, use the official Stripe Node.js library to create a payment intent.
    // 3. Return the `client_secret` from that API route.
    // 4. Replace the fetch call below to point to your new API route.
    
    let clientSecret = '';
    try {
        const response = await fetch('/api/create-payment-intent-placeholder');
        const data = await response.json();
        clientSecret = data.clientSecret;
    } catch(e) {
        setError("Could not connect to the backend to start the payment. Please create an API route to handle PaymentIntents.");
        setIsProcessing(false);
        return;
    }


    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
        setIsProcessing(false);
        return;
    }

    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (paymentError) {
      setError(paymentError.message || "An unexpected error occurred.");
      setIsProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      toast({
        title: 'Payment Successful!',
        description: 'Your reservation has been confirmed.',
      });

      // Update the reservation status in Firestore
      updateDocumentNonBlocking(reservationRef, { paymentStatus: 'completed' });
      
      // Redirect to a confirmation page or home
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
        setError("Payment did not succeed. Please try again.");
        setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: 'hsl(var(--foreground))',
        fontFamily: 'PT Sans, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      invalid: {
        color: 'hsl(var(--destructive))',
        iconColor: 'hsl(var(--destructive))',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
       <Alert className="mb-6">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Ready for a Real Payment Gateway</AlertTitle>
          <AlertDescription>
            This form uses Stripe Elements, but it's not connected to a backend. To process real payments, you'll need to create an API route that uses your Stripe Secret Key to create a PaymentIntent.
          </AlertDescription>
        </Alert>
      <div className="p-3 border rounded-md bg-background">
        <CardElement options={cardElementOptions} />
      </div>

      {error && <p className="text-sm text-destructive mt-4">{error}</p>}

      <Button size="lg" className="w-full mt-6" type="submit" disabled={!stripe || isProcessing || reservation.paymentStatus === 'completed'}>
        {isProcessing ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-5 w-5" />
        )}
        {reservation.paymentStatus === 'completed' 
            ? 'Payment Confirmed' 
            : isProcessing 
                ? 'Processing...' 
                : `Pay $${reservation.totalPrice.toFixed(2)}`}
      </Button>
    </form>
  );
};


const CheckoutFormWrapper: React.FC<CheckoutFormProps> = ({ reservation, reservationRef }) => {
    // Render the form only if the publishable key is available
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        return (
            <Alert variant="destructive">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Stripe Not Configured</AlertTitle>
                <AlertDescription>
                    Please add your Stripe publishable key to your Vercel environment variables as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable the payment form.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Elements stripe={stripePromise}>
            <PaymentForm reservation={reservation} reservationRef={reservationRef} />
        </Elements>
    )
}

export default CheckoutFormWrapper;
