'use server';

/**
 * @fileOverview An AI assistant that provides context-aware hints for completing practice drills.
 *
 * - generateHint - A function that generates hints based on the provided context.
 * - GenerateHintInput - The input type for the generateHint function.
 * - GenerateHintOutput - The return type for the generateHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHintInputSchema = z.object({
  drillContext: z.string().describe('The context of the practice drill, including the current question and user progress.'),
  userQuery: z.string().describe('The specific question or problem the user is facing.'),
});
export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('A helpful hint tailored to the user query and drill context.'),
});
export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const generateHintPrompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: {schema: GenerateHintInputSchema},
  output: {schema: GenerateHintOutputSchema},
  prompt: `You are an AI assistant designed to provide helpful hints for practice drills.

  Context of the drill: {{{drillContext}}}
  User's question: {{{userQuery}}}

  Provide a concise and relevant hint to help the user proceed with the drill.
  The hint should not directly give away the answer but guide the user towards the solution.`,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHint',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const {output} = await generateHintPrompt(input);
    return output!;
  }
);
