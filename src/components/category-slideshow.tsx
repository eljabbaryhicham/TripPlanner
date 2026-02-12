'use client';

import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import { Car, BedDouble, Briefcase, Compass } from 'lucide-react';
import { useSettings } from './settings-provider';

const categories = [
  {
    name: 'Cars',
    icon: Car,
    href: '/services/cars',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
    setting: 'cars',
  },
  {
    name: 'Hotels',
    icon: BedDouble,
    href: '/services/hotels',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
    setting: 'hotels',
  },
  {
    name: 'Pickup',
    icon: Briefcase,
    href: '/services/transport',
    image: 'https://images.unsplash.com/photo-1579362629245-c464d1ab5537?q=80&w=800&auto=format&fit=crop',
    setting: 'transport',
  },
  {
    name: 'Explore',
    icon: Compass,
    href: '/services/explore',
    image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop',
    setting: 'explore',
  },
];

const CategorySlideshow = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ]);
  const { categories: categorySettings } = useSettings();

  const [tweenValues, setTweenValues] = React.useState<number[]>([]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }
      return diffToTarget;
    });
    setTweenValues(styles);
  }, [emblaApi, setTweenValues]);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll();
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onScroll);
  }, [emblaApi, onScroll]);

  const activeCategories = categories.filter(
    (cat) => categorySettings[cat.setting as keyof typeof categorySettings] !== false
  );
  
  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <div className="embla" ref={emblaRef}>
      <div className="embla__container">
        {activeCategories.map((category, index) => {
          const tweenValue = tweenValues[index] || 0;
          const tweenStyle = {
            transform: `rotateY(${tweenValue * -30}deg) scale(${1 - Math.abs(tweenValue) * 0.15})`,
            opacity: 1 - Math.abs(tweenValue) || 0,
          };

          return (
            <div className="embla__slide" key={index} style={tweenStyle}>
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
          );
        })}
      </div>
    </div>
  );
};

export default CategorySlideshow;
