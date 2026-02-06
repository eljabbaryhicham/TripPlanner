'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Info, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type Reservation = {
    serviceName: string;
    totalPrice: number;
    priceUnit: string;
    createdAt: { seconds: number; nanoseconds: number };
    paymentStatus: string;
};

const CheckoutPage = () => {
    const { reservationId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isProcessing, setIsProcessing] = useState(false);

    const reservationRef = useMemoFirebase(() => {
        if (!firestore || !reservationId) return null;
        return doc(firestore, 'reservations', reservationId as string);
    }, [firestore, reservationId]);

    const { data: reservation, isLoading, error } = useDoc<Reservation>(reservationRef);

    const formattedDate = useMemo(() => {
        if (!reservation?.createdAt) return '';
        const date = new Date(reservation.createdAt.seconds * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [reservation]);

    const handlePayment = async () => {
        if (!reservationRef || reservation?.paymentStatus === 'completed') return;
        
        setIsProcessing(true);
        toast({
            title: 'Processing Payment...',
            description: 'Please wait, this will only take a moment.',
        });

        // Simulate payment gateway interaction
        await new Promise(resolve => setTimeout(resolve, 2000));

        updateDocumentNonBlocking(reservationRef, { paymentStatus: 'completed' });
        
        toast({
            title: 'Payment Successful!',
            description: 'Your reservation has been confirmed.',
        });

        // Redirect to a confirmation or home page after a short delay
        setTimeout(() => {
            router.push('/');
        }, 1500);
    };


    return (
        <div className="flex min-h-screen flex-col bg-muted/40">
            <Header />
            <main className="flex-1 py-24">
                <div className="container mx-auto px-4">
                    <Card className="mx-auto max-w-2xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-3xl">Secure Checkout</CardTitle>
                            <CardDescription>
                                Complete your reservation by providing your payment details below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold">Reservation Summary</h3>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ) : error ? (
                                    <Alert variant="destructive">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>
                                            Could not load reservation details. Please try again.
                                        </AlertDescription>
                                    </Alert>
                                ) : reservation ? (
                                    <div className="p-4 rounded-md border bg-background">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium">{reservation.serviceName}</p>
                                            <p className="font-semibold text-lg">
                                                ${reservation.totalPrice.toFixed(2)}
                                                <span className="text-sm text-muted-foreground">/{reservation.priceUnit}</span>
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Reserved on: {formattedDate}</p>
                                        <p className="text-sm font-medium mt-2 capitalize">
                                            Payment Status: <span className={reservation.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}>{reservation.paymentStatus}</span>
                                        </p>
                                    </div>
                                ) : (
                                     <p>No reservation found.</p>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="font-semibold">Payment Information</h3>
                                <Alert>
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertTitle>This is a simulation</AlertTitle>
                                    <AlertDescription>
                                        In a real application, this form would be powered by a secure payment provider like Stripe or PayPal. Do not enter real credit card information.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <Input id="cardNumber" placeholder="**** **** **** 1234" disabled={isProcessing || reservation?.paymentStatus === 'completed'} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">Expires</Label>
                                        <Input id="expiry" placeholder="MM/YY" disabled={isProcessing || reservation?.paymentStatus === 'completed'} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvc">CVC</Label>
                                        <Input id="cvc" placeholder="123" disabled={isProcessing || reservation?.paymentStatus === 'completed'} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP</Label>
                                        <Input id="zip" placeholder="12345" disabled={isProcessing || reservation?.paymentStatus === 'completed'} />
                                    </div>
                                </div>
                            </div>
                            <Button size="lg" className="w-full" onClick={handlePayment} disabled={isProcessing || !reservation || reservation?.paymentStatus === 'completed'}>
                                {isProcessing ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-2 h-5 w-5" />
                                )}
                                {reservation?.paymentStatus === 'completed' 
                                    ? 'Payment Confirmed' 
                                    : isProcessing 
                                        ? 'Processing...' 
                                        : `Pay $${reservation ? reservation.totalPrice.toFixed(2) : '0.00'}`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
