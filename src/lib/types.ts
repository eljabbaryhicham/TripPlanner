
export type ServiceCategory = 'cars' | 'hotels' | 'transport';

export interface AdditionalMedia {
  imageUrl: string;
  imageHint: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  isBestOffer?: boolean;
  category: ServiceCategory;
  price: number;
  priceUnit: 'day' | 'night' | 'trip';
  location: string;
  details: {
    [key: string]: string;
  };
  additionalMedia?: AdditionalMedia[];
}
