'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code completions using the Gemini 2.5 model.
 *
 * - generateCodeCompletion - A function that takes code context as input and returns a code completion suggestion.
 * - GenerateCodeCompletionInput - The input type for the generateCodeCompletion function.
 * - GenerateCodeCompletionOutput - The return type for the generateCodeCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeCompletionInputSchema = z.object({
  codeContext: z.string().describe('The surrounding code context for which to generate a completion.'),
  language: z.string().describe('The programming language of the code context.'),
});
export type GenerateCodeCompletionInput = z.infer<typeof GenerateCodeCompletionInputSchema>;

const GenerateCodeCompletionOutputSchema = z.object({
  completion: z.string().describe('The generated code completion suggestion.'),
});
export type GenerateCodeCompletionOutput = z.infer<typeof GenerateCodeCompletionOutputSchema>;

export async function generateCodeCompletion(input: GenerateCodeCompletionInput): Promise<GenerateCodeCompletionOutput> {
  return generateCodeCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeCompletionPrompt',
  input: {schema: GenerateCodeCompletionInputSchema},
  output: {schema: GenerateCodeCompletionOutputSchema},
  prompt: `You are an AI code completion assistant. You will be given a code snippet and you should suggest a possible completion.

  Language: {{{language}}}
  Code Context:
  -------------------
  {{{codeContext}}}
  -------------------

  Completion:`, // No Handlebars function calls allowed here!
});

const generateCodeCompletionFlow = ai.defineFlow(
  {
    name: 'generateCodeCompletionFlow',
    inputSchema: GenerateCodeCompletionInputSchema,
    outputSchema: GenerateCodeCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
