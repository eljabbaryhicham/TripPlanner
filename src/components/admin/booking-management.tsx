'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Inbox, ChevronDown, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const BookingManagement = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedBookings, setSelectedBookings] = React.useState<Set<string>>(new Set());
    const [isUpdating, setIsUpdating] = React.useState(false);

    const reservationsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'reservations')) : null, [firestore]);
    const inquiriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'inquiries')) : null, [firestore]);

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
        
        combined.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        
        return combined;
    }, [reservations, inquiries]);
    
    const isLoading = reservationsLoading || inquiriesLoading;

    const handleBatchAction = async (action: 'paid' | 'completed' | 'delete') => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }
        if (selectedBookings.size === 0) return;

        setIsUpdating(true);
        const promises = [];
        
        for (const bookingId of selectedBookings) {
            const booking = allBookings.find(b => b.id === bookingId);
            if (!booking) continue;

            let docRef;
            if (booking.type === 'Checkout' && booking._path) {
                docRef = doc(firestore, booking._path);
            } else if (booking.type === 'Checkout' && booking.userId) {
                // Fallback for any old data that might not have _path
                const collectionName = `users/${booking.userId}/reservations`;
                docRef = doc(firestore, collectionName, booking.id);
            } else if (booking.type === 'Inquiry') {
                docRef = doc(firestore, 'inquiries', booking.id);
            } else {
                toast({ variant: 'destructive', title: 'Action Failed', description: `Could not identify path for booking ID ${booking.id}.` });
                continue;
            }

            if (action === 'delete') {
                promises.push(deleteDoc(docRef));
            } else {
                let dataToUpdate = {};
                const isReservation = booking.type === 'Checkout';
                if (action === 'paid') {
                    dataToUpdate = { paymentStatus: isReservation ? 'completed' : 'paid' };
                } else if (action === 'completed') {
                    dataToUpdate = { status: 'completed' };
                }
                promises.push(updateDoc(docRef, dataToUpdate));
            }
        }
        
        try {
            await Promise.all(promises);
            toast({ title: 'Success', description: `Action performed on ${selectedBookings.size} item(s).` });
            setSelectedBookings(new Set());
        } catch (error) {
            console.error('Batch action failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Could not perform action. Check permissions.';
            toast({ variant: 'destructive', title: 'Action Failed', description: errorMessage });
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy, h:mm a');
        } catch (e) {
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
                 <div className="flex items-center py-4 gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={selectedBookings.size === 0 || isUpdating}>
                                Actions ({selectedBookings.size}) <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleBatchAction('paid')}><CheckCircle className="mr-2 h-4 w-4" />Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBatchAction('completed')}><CheckCircle className="mr-2 h-4 w-4" />Mark as Completed</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleBatchAction('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Selected</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {isUpdating && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>

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
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={selectedBookings.size > 0 && allBookings.every(b => selectedBookings.has(b.id))}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedBookings(new Set(allBookings.map(b => b.id)));
                                            } else {
                                                setSelectedBookings(new Set());
                                            }
                                        }}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allBookings.map((booking) => (
                                <TableRow key={booking.id} data-state={selectedBookings.has(booking.id) && "selected"}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedBookings.has(booking.id)}
                                            onCheckedChange={(checked) => {
                                                const newSelected = new Set(selectedBookings);
                                                if (checked) newSelected.add(booking.id);
                                                else newSelected.delete(booking.id);
                                                setSelectedBookings(newSelected);
                                            }}
                                            aria-label={`Select booking ${booking.id}`}
                                        />
                                    </TableCell>
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
                                        <Badge variant={booking.status === 'completed' ? 'outline' : 'secondary'} className="capitalize">
                                            {booking.status || (booking.type === 'Inquiry' ? 'pending' : 'active')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={(booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') ? 'default' : 'destructive'} 
                                            className="capitalize bg-opacity-70"
                                        >
                                            {booking.paymentStatus || (booking.type === 'Inquiry' ? 'unpaid' : 'pending')}
                                        </Badge>
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
