'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, Send } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

// Form for submitting a new review
const ReviewForm = ({ serviceId, serviceName }: { serviceId: string, serviceName: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    if (!user || !firestore) {
        return <p className="text-sm text-muted-foreground">You must be logged in to leave a review.</p>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || comment.trim() === '') {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a rating and a comment.' });
            return;
        }
        setIsSubmitting(true);

        const reviewData = {
            userId: user.uid,
            serviceId,
            serviceName,
            rating,
            comment,
            createdAt: serverTimestamp(),
            authorName: user.displayName || user.email || 'Anonymous',
            authorImage: user.photoURL || null,
        };

        try {
            await addDoc(collection(firestore, 'reviews'), reviewData);
            toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
            setRating(0);
            setComment('');
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your review. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold">Leave a Review</h3>
            <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground mr-2">Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)}>
                        <Star className={`h-6 w-6 cursor-pointer transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50 hover:text-amber-300'}`} />
                    </button>
                ))}
            </div>
            <Textarea 
                placeholder="Share your experience..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
            />
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Review
                </Button>
            </div>
        </form>
    );
};

// Main popup component
interface ReviewsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
}

const ReviewsPopup = ({ isOpen, onClose, serviceId, serviceName }: ReviewsPopupProps) => {
  const firestore = useFirestore();
  const { user } = useUser();

  const reviewsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'reviews'), where('serviceId', '==', serviceId)) : null,
    [firestore, serviceId]
  );
  
  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

  const sortedReviews = React.useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => {
      const timeA = a.createdAt?.seconds ?? 0;
      const timeB = b.createdAt?.seconds ?? 0;
      return timeB - timeA;
    });
  }, [reviews]);
  
  const averageRating = React.useMemo(() => {
    if (!sortedReviews || sortedReviews.length === 0) return 0;
    const total = sortedReviews.reduce((acc, review) => acc + review.rating, 0);
    return total / sortedReviews.length;
  }, [sortedReviews]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Reviews for {serviceName}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {sortedReviews && sortedReviews.length > 0 ? (
                <>
                    <span className="flex items-center text-amber-400">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        <span>{averageRating.toFixed(1)}</span>
                    </span>
                    <span className="text-muted-foreground">({sortedReviews.length} {sortedReviews.length === 1 ? 'review' : 'reviews'})</span>
                </>
            ) : (
                <span>No reviews yet. Be the first!</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {user && (
              <>
                <ReviewForm serviceId={serviceId} serviceName={serviceName} />
                <Separator />
              </>
            )}

            {isLoading && (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div className="flex items-start space-x-4" key={i}>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && sortedReviews && sortedReviews.length > 0 && (
                sortedReviews.map((review) => (
                    <div key={review.id}>
                    <div className="flex items-start space-x-4">
                        <Avatar>
                        <AvatarImage src={review.authorImage ?? `https://picsum.photos/seed/avatar${review.userId}/40/40`} alt={review.authorName} />
                        <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{review.authorName}</p>
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <div className="flex items-center text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'stroke-current'}`} />
                                ))}
                            </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </p>
                        <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                        </div>
                    </div>
                    {/* Add a separator between reviews */}
                    <Separator className="mt-6" />
                    </div>
                ))
            )}

            {!isLoading && (!sortedReviews || sortedReviews.length === 0) && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews have been submitted for this service yet.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsPopup;
