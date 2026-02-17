'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Inbox, ChevronDown, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BookingManagement = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedBookings, setSelectedBookings] = React.useState<Set<string>>(new Set());

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

    const handleBatchAction = async (action: 'paid' | 'unpaid' | 'completed' | 'delete') => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            return;
        }
        if (selectedBookings.size === 0) return;
        
        for (const bookingId of selectedBookings) {
            const booking = allBookings.find(b => b.id === bookingId);
            if (!booking || !booking._path) {
                 toast({ variant: 'destructive', title: 'Action Failed', description: `Could not identify path for booking ID ${bookingId}.` });
                continue;
            };

            const docRef = doc(firestore, booking._path);

            if (action === 'delete') {
                deleteDocumentNonBlocking(docRef);
            } else {
                let dataToUpdate = {};
                const isReservation = booking.type === 'Checkout';
                if (action === 'paid') {
                    dataToUpdate = { paymentStatus: isReservation ? 'completed' : 'paid' };
                } else if (action === 'unpaid') {
                    dataToUpdate = { paymentStatus: isReservation ? 'pending' : 'unpaid' };
                } else if (action === 'completed') {
                    dataToUpdate = { status: 'completed' };
                }
                updateDocumentNonBlocking(docRef, dataToUpdate);
            }
        }
        
        toast({ title: 'Success', description: `Action initiated for ${selectedBookings.size} item(s).` });
        setSelectedBookings(new Set());
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy, h:mm a');
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        
        doc.text("Bookings & Inquiries", 14, 16);

        const tableColumns = ["Date", "Customer", "Service", "Method", "Status", "Payment", "Price"];
        const tableRows: (string | number)[][] = [];

        allBookings.forEach(booking => {
            const bookingData = [
                formatDate(booking.createdAt),
                booking.customerName,
                booking.serviceName,
                booking.bookingMethod || booking.type,
                booking.status || (booking.type === 'Inquiry' ? 'pending' : 'active'),
                booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
                booking.totalPrice != null ? `$${booking.totalPrice.toFixed(2)}` : 'N/A'
            ];
            tableRows.push(bookingData);
        });

        // The 'any' cast is to work around TypeScript issues with the jspdf-autotable plugin.
        (doc as any).autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 20,
        });

        doc.save('bookings_and_inquiries.pdf');
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookings & Inquiries</CardTitle>
                <CardDescription>View all incoming reservations and manual booking inquiries.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-wrap items-center py-4 gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={selectedBookings.size === 0}>
                                Actions ({selectedBookings.size}) <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleBatchAction('paid')}><CheckCircle className="mr-2 h-4 w-4" />Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBatchAction('unpaid')}><XCircle className="mr-2 h-4 w-4" />Mark as Unpaid</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBatchAction('completed')}><CheckCircle className="mr-2 h-4 w-4" />Mark as Completed</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleBatchAction('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Selected</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        onClick={handleDownloadPdf}
                        disabled={isLoading || allBookings.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
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
                    <div className="relative max-h-[560px] overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card">
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
                                        <TableCell className="whitespace-nowrap">{formatDate(booking.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{booking.customerName}</div>
                                            {booking.email && <div className="text-xs text-muted-foreground truncate">{booking.email}</div>}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{booking.serviceName}</TableCell>
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
                                                variant={(booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') ? 'success' : 'destructive'} 
                                                className="capitalize"
                                            >
                                                {booking.paymentStatus || (booking.type === 'Inquiry' ? 'unpaid' : 'pending')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium whitespace-nowrap">
                                            {booking.totalPrice != null ? `$${booking.totalPrice.toFixed(2)}` : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BookingManagement;
