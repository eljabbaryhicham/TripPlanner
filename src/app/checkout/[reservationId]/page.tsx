'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CheckoutFormWrapper from '@/components/checkout-form';

type Reservation = {
    serviceName: string;
    totalPrice: number;
    priceUnit: string;
    createdAt: { seconds: number; nanoseconds: number };
    paymentStatus: string;
};

const CheckoutPage = () => {
    const { reservationId } = useParams();
    const firestore = useFirestore();

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

                            {reservation && reservationRef && (
                                <CheckoutFormWrapper 
                                    reservation={reservation}
                                    reservationRef={reservationRef}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
