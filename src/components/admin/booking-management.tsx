'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const BookingManagement = () => {
    const firestore = useFirestore();

    const reservationsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'reservations'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const inquiriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'inquiries'), orderBy('createdAt', 'desc')) : null, [firestore]);

    const { data: reservations, isLoading: reservationsLoading } = useCollection(reservationsQuery);
    const { data: inquiries, isLoading: inquiriesLoading } = useCollection(inquiriesQuery);
    
    const allBookings = React.useMemo(() => {
        const combined: any[] = [];
        if (reservations) {
            combined.push(...reservations.map(r => ({ ...r, type: 'Checkout' })));
        }
        if (inquiries) {
            combined.push(...inquiries.map(i => ({ ...i, type: 'Inquiry' })));
        }
        
        // Sort combined array by createdAt timestamp descending
        combined.sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeB - timeA;
        });
        
        return combined;
    }, [reservations, inquiries]);
    
    const isLoading = reservationsLoading || inquiriesLoading;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy, h:mm a');
        } catch (e) {
            // Fallback for potentially non-timestamp values from admin actions
            return 'Invalid Date';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookings & Inquiries</CardTitle>
                <CardDescription>View all incoming reservations and manual booking inquiries.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : allBookings.length === 0 ? (
                    <div className="text-center py-10">
                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">No bookings or inquiries found yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allBookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>{formatDate(booking.createdAt)}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{booking.customerName}</div>
                                        {booking.email && <div className="text-xs text-muted-foreground">{booking.email}</div>}
                                    </TableCell>
                                    <TableCell>{booking.serviceName}</TableCell>
                                    <TableCell>
                                        <Badge variant={booking.type === 'Checkout' ? 'default' : 'secondary'} className="capitalize">
                                            {booking.bookingMethod || booking.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-medium capitalize ${booking.paymentStatus === 'completed' ? 'text-green-500' : booking.paymentStatus === 'pending' ? 'text-orange-500' : ''}`}>
                                            {booking.paymentStatus || 'Submitted'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {booking.totalPrice != null ? `$${booking.totalPrice.toFixed(2)}` : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default BookingManagement;
