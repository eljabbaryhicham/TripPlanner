'use client';

import { 
    Car, 
    BedDouble, 
    Briefcase, 
    Compass, 
    Plane, 
    Ship, 
    Train, 
    Map, 
    Star,
    type LucideProps
} from 'lucide-react';

export const ICONS = {
  Car,
  BedDouble,
  Briefcase,
  Compass,
  Plane,
  Ship,
  Train,
  Map,
  Star,
};

export const ICON_NAMES = Object.keys(ICONS);

export const Icon = ({ name, ...props }: { name: string } & LucideProps) => {
  if (!name || !ICONS[name as keyof typeof ICONS]) {
    return <Compass {...props} />; // Fallback icon
  }
  const IconComponent = ICONS[name as keyof typeof ICONS];
  return <IconComponent {...props} />;
};