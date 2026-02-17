
'use client';

import * as React from 'react';
import { Compass } from 'lucide-react';
import { useSettings } from './settings-provider';

const AiSuggestions = () => {
  const settings = useSettings();

  return (
    <div
      className="absolute inset-0 bg-background"
      style={!settings.isSettingsLoading && settings.suggestionsBackgroundImageUrl ? {
        backgroundImage: `url('${settings.suggestionsBackgroundImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {!settings.isSettingsLoading && settings.suggestionsBackgroundImageUrl && <div className="absolute inset-0 bg-black/90" />}
      <div className="relative flex h-full items-center justify-center">
        <div className="container mx-auto px-4 text-center">
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
      </div>
    </div>
  );
};

export default AiSuggestions;
