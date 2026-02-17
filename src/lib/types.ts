export type ServiceCategory = 'cars' | 'hotels' | 'transport' | 'explore' | string;

export interface AdditionalMedia {
  imageUrl: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  label?: string;
  description: string;
  imageUrl: string;
  isBestOffer?: boolean;
  isActive?: boolean;
  category: ServiceCategory;
  price: number;
  priceUnit: 'day' | 'night' | 'trip';
  location: string;
  details: {
    [key: string]: string;
  };
  additionalMedia?: AdditionalMedia[];
}

export interface Review {
  id: string;
  userId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
  authorName: string;
  authorImage?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  href: string;
  imageUrl: string;
  enabled: boolean;
}