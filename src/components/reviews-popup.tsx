'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { Separator } from './ui/separator';

const reviews = [
  {
    id: '1',
    author: 'Alex Johnson',
    rating: 5,
    comment: 'Absolutely fantastic service! The car was clean, and the pickup process was seamless. Highly recommend for anyone visiting the city.',
    date: '2024-07-15',
  },
  {
    id: '2',
    author: 'Maria Garcia',
    rating: 4,
    comment: 'Good value for the price. The hotel was in a great location, though the room was a bit smaller than expected. Staff was very friendly.',
    date: '2024-07-12',
  },
  {
    id: '3',
    author: 'David Chen',
    rating: 5,
    comment: "The airport shuttle was on time and the driver was very professional. Made my travel day so much less stressful. Will use again!",
    date: '2024-07-10',
  },
];

interface ReviewsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
}

const ReviewsPopup = ({ isOpen, onClose, serviceName }: ReviewsPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Reviews for {serviceName}</DialogTitle>
          <DialogDescription>
            See what other customers are saying about this service.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {reviews.map((review, index) => (
            <div key={index}>
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={`https://picsum.photos/seed/avatar${review.id}/40/40`} alt={review.author} />
                  <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{review.author}</p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                       <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'stroke-current'}`} />
                        ))}
                        </div>
                        <span className="text-muted-foreground">({review.rating}.0)</span>
                    </div>
                  </div>
                   <p className="text-xs text-muted-foreground">{review.date}</p>
                  <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                </div>
              </div>
              {index < reviews.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewsPopup;
