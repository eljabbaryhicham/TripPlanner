'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Star, Trash2, MoreHorizontal, Edit, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Review } from '@/lib/types';
import { ReviewEditor } from './review-editor';
import { Skeleton } from '../ui/skeleton';

function DeleteReviewMenuItem({ review }: { review: Review }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleDelete = () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection not available.' });
            return;
        }
        const docRef = doc(firestore, 'reviews', review.id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Review Deletion Initiated' });
        setDialogOpen(false);
    };

    return (
        <>
             <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the review from "{review.authorName}".
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => {e.preventDefault(); setDialogOpen(true)}}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>
        </>
    );
}

const ReviewManagement = () => {
    const firestore = useFirestore();
    const reviewsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'reviews') : null, [firestore]);
    const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
    
    const [editorOpen, setEditorOpen] = React.useState(false);
    const [reviewToEdit, setReviewToEdit] = React.useState<Review | null>(null);

    const handleEditReview = (review: Review) => {
        setReviewToEdit(review);
        setEditorOpen(true);
    };

    const sortedReviews = React.useMemo(() => {
        if (!reviews) return [];
        return [...reviews].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }, [reviews]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy');
        } catch (e) {
            return 'Invalid Date';
        }
    };
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Review Management</CardTitle>
                    <CardDescription>View, edit, or delete customer reviews.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    ) : sortedReviews.length === 0 ? (
                        <div className="text-center py-10">
                            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No reviews have been submitted yet.</p>
                        </div>
                    ) : (
                        <div className="relative max-h-[560px] overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-card">
                                    <TableRow>
                                        <TableHead>Author</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Comment</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedReviews.map((review) => (
                                        <TableRow key={review.id}>
                                            <TableCell>{review.authorName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 mr-1 text-amber-400 fill-amber-400" />
                                                    {review.rating}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                                            <TableCell>{review.serviceName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatDate(review.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditReview(review)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DeleteReviewMenuItem review={review} />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <ReviewEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                review={reviewToEdit}
            />
        </>
    );
};

export default ReviewManagement;
