'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized service suggestions (hotels, transport, rentals, destinations)
 *  based on user's past behavior and preferences.
 *
 * - personalizedServiceSuggestions - A function that retrieves personalized service suggestions for a user.
 * - PersonalizedServiceSuggestionsInput - The input type for the personalizedServiceSuggestions function.
 * - PersonalizedServiceSuggestionsOutput - The return type for the personalizedServiceSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedServiceSuggestionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user to get suggestions for.'),
  pastBehavior: z.string().describe('A description of the users past behavior and preferences.'),
});
export type PersonalizedServiceSuggestionsInput = z.infer<typeof PersonalizedServiceSuggestionsInputSchema>;

const PersonalizedServiceSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of personalized service suggestions.'),
});
export type PersonalizedServiceSuggestionsOutput = z.infer<typeof PersonalizedServiceSuggestionsOutputSchema>;

export async function personalizedServiceSuggestions(input: PersonalizedServiceSuggestionsInput): Promise<PersonalizedServiceSuggestionsOutput> {
  return personalizedServiceSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedServiceSuggestionsPrompt',
  input: {schema: PersonalizedServiceSuggestionsInputSchema},
  output: {schema: PersonalizedServiceSuggestionsOutputSchema},
  prompt: `You are a travel planning assistant. Based on the user's past behavior and preferences, provide personalized service suggestions (hotels, transport, rentals, destinations).

  Past Behavior and Preferences: {{{pastBehavior}}}

  Suggestions:`,
});

const personalizedServiceSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedServiceSuggestionsFlow',
    inputSchema: PersonalizedServiceSuggestionsInputSchema,
    outputSchema: PersonalizedServiceSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
