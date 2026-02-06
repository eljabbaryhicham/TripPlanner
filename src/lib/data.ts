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
    name: 'Airport Express Shuttle',
    price: 25,
    priceUnit: 'trip',
    location: 'Airport to Downtown',
    details: {
      'Max Passengers': '12',
      'Luggage': '1 per person',
      'Schedule': 'Every 30 mins',
    },
  },
  {
    ...getImage('transport-2'),
    category: 'transport',
    name: 'InterCity High-Speed Rail',
    price: 75,
    priceUnit: 'trip',
    location: 'Central Station',
    details: {
      Class: 'First Class',
      'Amenities': 'WiFi, Power Outlets, Cafe Car',
      'Duration': '2 hours',
    },
  },
  {
    ...getImage('transport-3'),
    category: 'transport',
    name: 'Executive Chauffeur',
    price: 120,
    priceUnit: 'trip',
    location: 'City-wide',
    details: {
      'Vehicle': 'Luxury Sedan',
      'Service': 'Point-to-point',
      'Includes': 'Water, Mints',
    },
  },
];
