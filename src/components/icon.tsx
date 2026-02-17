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
import { cn } from '@/lib/utils';

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

export const ICON_NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[];

export const Icon = ({ name, className, ...props }: { name: string } & LucideProps) => {
  if (ICONS[name as keyof typeof ICONS]) {
    const IconComponent = ICONS[name as keyof typeof ICONS];
    return <IconComponent className={className} {...props} />;
  }
  
  // Fallback to Google Material Symbols
  // Note: size is controlled by font-size for Material Symbols.
  // The provided className should include text-size utilities (e.g., 'text-2xl').
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      // We don't spread props here as they are Lucide-specific and may not be valid for a span
    >
      {name}
    </span>
  );
};
