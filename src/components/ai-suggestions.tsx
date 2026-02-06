'use client';

import * as React from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { personalizedServiceSuggestions } from '@/ai/flows/personalized-service-suggestions';

const AiSuggestions = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const getSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const result = await personalizedServiceSuggestions({
        userId: 'user-123',
        pastBehavior:
          'User has previously booked budget-friendly hotels and compact cars for weekend trips.',
      });
      setSuggestions(result.suggestions);
    } catch (e) {
      setError('Failed to get suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-primary/5 py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-accent" />
        <h2 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
          Need some inspiration?
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          Let our AI provide personalized suggestions for your next trip based on
          your preferences.
        </p>
        <Button
          size="lg"
          className="mt-8"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)'}}
          onClick={getSuggestions}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-5 w-5" />
              Get AI Suggestions
            </>
          )}
        </Button>

        {error && <p className="mt-4 text-destructive">{error}</p>}

        {suggestions.length > 0 && (
          <div className="mt-12 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">
                  Here are some ideas for you:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default AiSuggestions;
