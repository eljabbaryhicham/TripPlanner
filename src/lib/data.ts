import type { Service } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find((img) => img.id === id);
  if (!image) {
    throw new Error(`Image with id ${id} not found`);
  }
  return image;
};

export const services: Service[] = [
  {
    ...getImage('car-1'),
    category: 'cars',
    name: 'City Compact',
    price: 45,
    priceUnit: 'day',
    location: 'Downtown',
    details: {
      Seats: '4',
      Transmission: 'Automatic',
      'Fuel Policy': 'Full to full',
    },
  },
  {
    ...getImage('car-2'),
    category: 'cars',
    name: 'Adventure SUV',
    price: 80,
    priceUnit: 'day',
    location: 'Airport',
    details: {
      Seats: '5',
      Transmission: 'Automatic',
      'Fuel Policy': 'Full to full',
    },
  },
  {
    ...getImage('car-3'),
    category: 'cars',
    name: 'Eco-Friendly Sedan',
    price: 60,
    priceUnit: 'day',
    location: 'City Center',
    details: {
      Seats: '5',
      Transmission: 'Automatic',
      Type: 'Electric',
    },
  },
  {
    ...getImage('hotel-1'),
    category: 'hotels',
    name: 'The Grand View Hotel',
    price: 250,
    priceUnit: 'night',
    location: 'Seaside',
    details: {
      Rating: '★★★★★',
      Amenities: 'Pool, Spa, Free WiFi',
      'Room Type': 'Deluxe King',
    },
  },
  {
    ...getImage('hotel-2'),
    category: 'hotels',
    name: 'The Backpacker Nook',
    price: 40,
    priceUnit: 'night',
    location: 'Old Town',
    details: {
      Rating: '★★★★☆',
      Amenities: 'Shared Kitchen, Lockers, WiFi',
      'Room Type': '8-Bed Dorm',
    },
  },
  {
    ...getImage('hotel-3'),
    category: 'hotels',
    name: 'Metropolis Business Inn',
    price: 150,
    priceUnit: 'night',
    location: 'Financial District',
    details: {
      Rating: '★★★★☆',
      Amenities: 'Gym, Conference Rooms, Restaurant',
      'Room Type': 'Standard Queen',
    },
  },
  {
    ...getImage('transport-1'),
    category: 'transport',
    name: 'Airport Pickup & Guide',
    price: 150,
    priceUnit: 'trip',
    location: 'Airport Arrivals',
    description:
      'A personal guide will meet you at the arrivals gate and a private car will take you to your destination, with a quick orientation of the city on the way.',
    details: {
      Rating: '★★★★★',
      Service: 'Personal meet & greet',
      Includes: 'City orientation, Private car',
      Vehicle: 'Comfortable Sedan',
    },
  },
];

const bestCar = services.find((service) => service.category === 'cars');
const bestHotel = services.find((service) => service.category === 'hotels');
const bestTransport = services.find(
  (service) => service.category === 'transport'
);

export const bestOffers: Service[] = [bestCar, bestHotel, bestTransport].filter(
  (service): service is Service => service !== undefined
);
