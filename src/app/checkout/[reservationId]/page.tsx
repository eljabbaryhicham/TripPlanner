'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Info, XCircle } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CheckoutFormWrapper from '@/components/checkout-form';
import { Button } from '@/components/ui/button';

type Reservation = {
    customerName: string;
    serviceName: string;
    totalPrice: number;
    priceUnit: string;
    createdAt: { seconds: number; nanoseconds: number };
    paymentStatus: string;
    startDate?: { seconds: number; nanoseconds: number };
    endDate?: { seconds: number; nanoseconds: number };
};

const CheckoutPage = () => {
    const { reservationId } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const reservationRef = useMemoFirebase(() => {
        if (!firestore || !user || !reservationId) return null;
        return doc(firestore, 'users', user.uid, 'reservations', reservationId as string);
    }, [firestore, user, reservationId]);

    const { data: reservation, isLoading: isReservationLoading, error } = useDoc<Reservation>(reservationRef);

    const formattedDate = useMemo(() => {
        if (!reservation?.createdAt) return '';
        const date = new Date(reservation.createdAt.seconds * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [reservation]);

    const formattedPeriod = useMemo(() => {
        if (!reservation?.startDate || !reservation?.endDate) return '';
        const from = new Date(reservation.startDate.seconds * 1000);
        const to = new Date(reservation.endDate.seconds * 1000);
        const fromString = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const toString = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${fromString} - ${toString}`;
    }, [reservation]);

    const isLoading = isReservationLoading || isUserLoading;

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
                                    <div className="p-4 rounded-md border bg-background space-y-4">
                                        <Skeleton className="h-5 w-1/4" />
                                        <Skeleton className="h-6 w-1/2" />
                                        <Separator/>
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-6 w-1/3" />
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
                                    <div className="p-4 rounded-md border bg-background space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Billed to</p>
                                            <p className="font-medium">{reservation.customerName}</p>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{reservation.serviceName}</p>
                                                <p className="text-sm text-muted-foreground">Reserved on: {formattedDate}</p>
                                                {(reservation.startDate && reservation.endDate) &&
                                                    <p className="text-sm text-muted-foreground">Dates: {formattedPeriod}</p>
                                                }
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-lg">
                                                    ${reservation.totalPrice.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    / {reservation.priceUnit}
                                                </p>
                                            </div>
                                        </div>
                                         <p className="text-sm font-medium capitalize pt-2">
                                            Payment Status: <span className={reservation.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-500'}>{reservation.paymentStatus}</span>
                                        </p>
                                    </div>
                                ) : (
                                     <p>No reservation found. It may belong to another user or has been deleted.</p>
                                )}
                            </div>

                            <Separator />

                            {reservation && reservationRef && (
                                <CheckoutFormWrapper 
                                    reservation={reservation}
                                    reservationRef={reservationRef}
                                />
                            )}

                            <div className="mt-4 text-center">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Checkout
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;
