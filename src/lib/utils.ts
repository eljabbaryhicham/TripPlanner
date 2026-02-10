import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ & /g, '-and-')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const getTransportPrice = (from: string, to: string): number | null => {
    // Simple pricing logic based on a few routes. This should be expanded in a real app.
    if (!from || !to) return null;

    const fromCity = from.split(' ')[0];

    // Trips within the same city
    if (fromCity === to) return 50;

    // Specific popular routes
    if (from.includes('Casablanca') && to === 'Rabat') return 80;
    if (from.includes('Casablanca') && to === 'Marrakech') return 150;
    if (from.includes('Marrakech') && to === 'Casablanca') return 150;
    if (from.includes('Marrakech') && to === 'Agadir') return 180;
    if (from.includes('Rabat') && to === 'Casablanca') return 80;
    if (from.includes('Rabat') && to === 'Fes') return 120;
    if (from.includes('Agadir') && to === 'Marrakech') return 180;

    // General tiered pricing as a fallback
    if (from.includes('Casablanca')) return 250;
    if (from.includes('Marrakech')) return 220;
    if (from.includes('Rabat')) return 200;
    if (from.includes('Agadir')) return 280;
    
    return 300; // Farthest distance default
};
