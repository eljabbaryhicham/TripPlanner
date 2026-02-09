'use client';

import * as React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, Send, Mountain } from 'lucide-react';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';

// Form for submitting a new review
const ReviewForm = ({ serviceId, serviceName }: { serviceId: string, serviceName: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');
    const [name, setName] = React.useState('');
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
            authorName: name.trim() || user.displayName || 'Client',
            authorImage: user.photoURL || null,
        };

        try {
            await addDoc(collection(firestore, 'reviews'), reviewData);
            toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
            setRating(0);
            setComment('');
            setName('');
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
            <Input
                placeholder="Your Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
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
  reviews: Review[] | null;
  averageRating: number;
  isLoading: boolean;
}

const ReviewsPopup = ({ isOpen, onClose, serviceId, serviceName, reviews, averageRating, isLoading }: ReviewsPopupProps) => {
  const { user } = useUser();
  
  const sortedReviews = React.useMemo(() => {
    if (!reviews) return [];
    // Create a mutable copy before sorting
    return [...reviews].sort((a, b) => {
      const timeA = a.createdAt?.seconds ?? 0;
      const timeB = b.createdAt?.seconds ?? 0;
      return timeB - timeA; // Sort descending
    });
  }, [reviews]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Reviews for {serviceName}</DialogTitle>
          <DialogDescription asChild>
             {sortedReviews && sortedReviews.length > 0 ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center text-amber-400">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        <span>{averageRating.toFixed(1)}</span>
                    </span>
                    <span>({sortedReviews.length} {sortedReviews.length === 1 ? 'review' : 'reviews'})</span>
                </span>
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
                  <div className="flex items-start space-x-4 pt-6" key={i}>
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
                sortedReviews.map((review, index) => (
                  <React.Fragment key={review.id}>
                    {index > 0 && <Separator className="my-6" />}
                    <div className="pt-6">
                      <div className="flex items-start space-x-4">
                          <Avatar>
                              <AvatarImage src={review.authorImage || ''} alt={review.authorName} />
                              <AvatarFallback>
                                  {review.authorImage ? review.authorName.charAt(0) : <Mountain className="h-5 w-5" />}
                              </AvatarFallback>
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
                    </div>
                  </React.Fragment>
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
