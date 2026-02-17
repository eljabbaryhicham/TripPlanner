'use client';

import * as React from 'react';
import type { Review } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ReviewEditorProps {
    isOpen: boolean;
    onClose: () => void;
    review: Review | null;
}

const reviewSchema = z.object({
    id: z.string(),
    authorName: z.string().min(1, 'Author name is required'),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, 'Comment is required'),
});

export const ReviewEditor = ({ isOpen, onClose, review }: ReviewEditorProps) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form state
    const [authorName, setAuthorName] = React.useState('');
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');

    const isEditing = !!review?.id;

    React.useEffect(() => {
        if (isOpen && review) {
            setAuthorName(review.authorName);
            setRating(review.rating);
            setComment(review.comment);
        } else if (!isOpen) {
            setAuthorName('');
            setRating(0);
            setComment('');
        }
    }, [review, isOpen]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const dataToValidate = {
            id: review?.id,
            authorName,
            rating,
            comment,
        };

        const parsed = reviewSchema.safeParse(dataToValidate);

        if (!parsed.success) {
            toast({ variant: 'destructive', title: 'Invalid Data', description: parsed.error.errors.map(e => e.message).join('\n') });
            setIsSubmitting(false);
            return;
        }
        
        if (!firestore || !review) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection or review data not available.' });
            setIsSubmitting(false);
            return;
        }

        const { id, ...reviewData } = parsed.data;
        const docRef = doc(firestore, 'reviews', id);
        
        updateDocumentNonBlocking(docRef, reviewData);
        
        toast({ title: 'Review Updated', description: 'Your changes have been saved successfully.' });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Review' : 'Add New Review'}</DialogTitle>
                    <DialogDescription>
                        Modify the review details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] p-1">
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <Label htmlFor="authorName">Author Name</Label>
                                <Input id="authorName" value={authorName} onChange={e => setAuthorName(e.target.value)} required />
                            </div>
                             <div className="space-y-2">
                                <Label>Rating</Label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setRating(star)}>
                                            <Star className={`h-7 w-7 cursor-pointer transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/50 hover:text-amber-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comment">Comment</Label>
                                <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} required rows={8} />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
