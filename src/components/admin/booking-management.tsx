'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Inbox, ChevronDown, Trash2, CheckCircle, XCircle, Download, DollarSign, Ban, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';

// New StatCard component for displaying statistics
const StatCard = ({ title, amount, icon }: { title: string, amount: number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </CardContent>
    </Card>
);

const BookingManagement = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedBookings, setSelectedBookings] = React.useState<Set<string>>(new Set());
    const [timeRange, setTimeRange] = React.useState('lifetime');

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

    const filteredBookings = React.useMemo(() => {
        if (timeRange === 'lifetime') return allBookings;
        return allBookings.filter(booking => {
            if (!booking.createdAt?.seconds) return false;
            const bookingDate = new Date(booking.createdAt.seconds * 1000);
            if (timeRange === 'day') return isToday(bookingDate);
            if (timeRange === 'week') return isThisWeek(bookingDate, { weekStartsOn: 1 });
            if (timeRange === 'month') return isThisMonth(bookingDate);
            if (timeRange === 'year') return isThisYear(bookingDate);
            return true;
        });
    }, [allBookings, timeRange]);

    const stats = React.useMemo(() => {
        return filteredBookings.reduce((acc, booking) => {
            const price = booking.totalPrice || 0;
            const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
            const isCancelled = booking.status === 'cancelled';

            if(isCancelled) {
                acc.cancelledAmount += price;
            } else if (isPaid) {
                acc.income += price;
            } else {
                acc.pendingAmount += price;
            }
            return acc;
        }, { income: 0, pendingAmount: 0, cancelledAmount: 0 });
    }, [filteredBookings]);
    
    const isLoading = reservationsLoading || inquiriesLoading;

    const handleBatchAction = async (action: 'paid' | 'unpaid' | 'cancelled' | 'delete') => {
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
                    dataToUpdate = {
                        paymentStatus: isReservation ? 'completed' : 'paid',
                        status: 'completed'
                    };
                } else if (action === 'unpaid') {
                    dataToUpdate = {
                        paymentStatus: isReservation ? 'pending' : 'unpaid',
                        status: 'pending'
                    };
                } else if (action === 'cancelled') {
                    dataToUpdate = { 
                        status: 'cancelled',
                        paymentStatus: isReservation ? 'pending' : 'unpaid' 
                    };
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

        filteredBookings.forEach(booking => {
            const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
            const isCancelled = booking.status === 'cancelled';
            let statusText = 'Pending';
            let paymentText = booking.paymentStatus || (booking.type === 'Inquiry' ? 'unpaid' : 'pending');
            paymentText = paymentText.charAt(0).toUpperCase() + paymentText.slice(1);

            if (isCancelled) {
                statusText = 'Cancelled';
            } else if (isPaid) {
                statusText = 'Completed';
            }
            
            const bookingData = [
                formatDate(booking.createdAt),
                booking.customerName,
                booking.serviceName,
                booking.bookingMethod || booking.type,
                statusText,
                paymentText,
                booking.totalPrice != null ? `$${booking.totalPrice.toFixed(2)}` : 'N/A'
            ];
            tableRows.push(bookingData);
        });

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
                <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-end">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lifetime">Lifetime</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="day">Today</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard title="Income" amount={stats.income} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                        <StatCard title="Pending" amount={stats.pendingAmount} icon={<Hourglass className="h-4 w-4 text-muted-foreground" />} />
                        <StatCard title="Cancelled" amount={stats.cancelledAmount} icon={<Ban className="h-4 w-4 text-muted-foreground" />} />
                    </div>
                </div>

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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleBatchAction('cancelled')} className="text-destructive focus:text-destructive"><XCircle className="mr-2 h-4 w-4" />Mark as Cancelled</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleBatchAction('delete')} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Selected</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        onClick={handleDownloadPdf}
                        disabled={isLoading || filteredBookings.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-10">
                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">No bookings or inquiries found for this period.</p>
                    </div>
                ) : (
                    <div className="relative max-h-[560px] overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card">
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedBookings.size > 0 && filteredBookings.length > 0 && filteredBookings.every(b => selectedBookings.has(b.id))}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
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
                                {filteredBookings.map((booking) => (
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
                                            {(() => {
                                                const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
                                                const isCancelled = booking.status === 'cancelled';

                                                let text = 'Pending';
                                                let variant: "success" | "destructive" | "secondary" = 'secondary';
                                                if (isCancelled) {
                                                    text = 'Cancelled';
                                                    variant = 'destructive';
                                                } else if (isPaid) {
                                                    text = 'Completed';
                                                    variant = 'success';
                                                }

                                                return (
                                                    <Badge
                                                        variant={variant}
                                                        className={cn("capitalize",
                                                            text === 'Pending' && "bg-chart-3 border-transparent text-primary-foreground hover:bg-chart-3/90"
                                                        )}
                                                    >
                                                        {text}
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={(booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') ? 'success' : 'destructive'}
                                                className={cn("capitalize",
                                                    (booking.paymentStatus === 'pending' || booking.paymentStatus === 'unpaid')
                                                    && "bg-chart-3 border-transparent text-primary-foreground hover:bg-chart-3/90"
                                                )}
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
