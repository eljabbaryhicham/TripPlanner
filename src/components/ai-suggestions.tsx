'use client';

import * as React from 'react';
import { Compass } from 'lucide-react';

const AiSuggestions = () => {
  return (
    <section
      className="relative py-16 text-white md:py-24"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=2052&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="container relative mx-auto px-4 text-center">
        <Compass className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
          Your Journey, Simplified
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-white/90 md:text-xl">
          We've handpicked the best cars, hotels, and transport options to make
          your travel planning effortless. Explore our top offers below and find
          the perfect fit for your next adventure.
        </p>
      </div>
    </section>
  );
};

export default AiSuggestions;
