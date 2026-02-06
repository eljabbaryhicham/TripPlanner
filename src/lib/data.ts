import { services } from './placeholder-images';
import type { Service } from './types';

export { services };

export const bestOffers: Service[] = services.filter(
  (service) => service.isBestOffer
);
