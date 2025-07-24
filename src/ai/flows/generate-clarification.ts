'use server';

/**
 * @fileOverview Provides an AI assistant to clarify ML concepts.
 *
 * - generateClarification - A function that generates clarifications for ML concepts.
 * - GenerateClarificationInput - The input type for the generateClarification function.
 * - GenerateClarificationOutput - The return type for the generateClarification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateClarificationInputSchema = z.object({
  concept: z.string().describe('The ML concept to clarify.'),
  userQuestion: z.string().describe('The specific question from the user.'),
});
export type GenerateClarificationInput = z.infer<typeof GenerateClarificationInputSchema>;

const GenerateClarificationOutputSchema = z.object({
  clarification: z.string().describe('The clarification of the ML concept.'),
});
export type GenerateClarificationOutput = z.infer<typeof GenerateClarificationOutputSchema>;

export async function generateClarification(input: GenerateClarificationInput): Promise<GenerateClarificationOutput> {
  return generateClarificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateClarificationPrompt',
  input: {schema: GenerateClarificationInputSchema},
  output: {schema: GenerateClarificationOutputSchema},
  prompt: `You are a helpful AI assistant designed to clarify machine learning concepts. A user is trying to understand the concept. Provide a clear and concise explanation to address their question. 

Concept: {{{concept}}}
User Question: {{{userQuestion}}}

Clarification:`, // Removed example clarification
});

const generateClarificationFlow = ai.defineFlow(
  {
    name: 'generateClarificationFlow',
    inputSchema: GenerateClarificationInputSchema,
    outputSchema: GenerateClarificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
