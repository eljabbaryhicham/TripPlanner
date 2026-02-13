
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Car, BedDouble, Briefcase, Compass } from 'lucide-react';
import { useSettings } from './settings-provider';

const baseCategories = [
  {
    name: 'Cars',
    icon: Car,
    href: '/services/cars',
    setting: 'cars',
  },
  {
    name: 'Hotels',
    icon: BedDouble,
    href: '/services/hotels',
    setting: 'hotels',
  },
  {
    name: 'Pickup',
    icon: Briefcase,
    href: '/services/transport',
    setting: 'transport',
  },
  {
    name: 'Explore',
    icon: Compass,
    href: '/services/explore',
    setting: 'explore',
  },
];

const CategorySlideshow = () => {
  const { categories: categorySettings, categoryImages } = useSettings();

  const activeCategories = React.useMemo(() => {
    return baseCategories
      .filter(cat => categorySettings[cat.setting as keyof typeof categorySettings] !== false)
      .map(cat => ({
        ...cat,
        image: categoryImages?.[cat.setting as keyof typeof categoryImages] || ''
      }));
  }, [categorySettings, categoryImages]);

  if (activeCategories.length === 0) {
    return null;
  }
  
  // Duplicate slides for seamless animation
  const duplicatedSlides = [...activeCategories, ...activeCategories, ...activeCategories, ...activeCategories, ...activeCategories];
  const slides = duplicatedSlides.slice(0, Math.max(10, duplicatedSlides.length));

  return (
    <div className="scroller" data-animated="true">
      <div className="scroller__inner">
        {slides.map((category, index) => (
          <div className="scroller__slide" key={`${category.href}-${index}`}>
            <Link href={category.href}>
              <div className="relative aspect-[3/4] h-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <category.icon className="h-8 w-8 mb-2 opacity-90 drop-shadow-lg" />
                  <h3 className="font-headline text-3xl font-bold drop-shadow-lg">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySlideshow;
