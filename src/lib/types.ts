import type { ImagePlaceholder } from './placeholder-images';

export type ServiceCategory = 'cars' | 'hotels' | 'transport';

export interface Service extends ImagePlaceholder {
  category: ServiceCategory;
  name: string;
  price: number;
  priceUnit: 'day' | 'night' | 'trip';
  location: string;
  details: {
    [key: string]: string;
  };
}
