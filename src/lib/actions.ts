'use server';

import { generateClarification } from '@/ai/flows/generate-clarification';
import { generateCodeCompletion } from '@/ai/flows/generate-code-completion';
import { generateDrillFromPrompt } from '@/ai/flows/generate-drill-from-prompt';
import { generateHint } from '@/ai/flows/generate-hint';
import { runFlow } from '@genkit-ai/flow'; // Corrected import
import { z } from 'zod';

// We define the input schemas here to ensure type safety
const GenerateHintInputSchema = z.object({
  drillContext: z.string(),
  userQuery: z.string(),
});

const GenerateClarificationInputSchema = z.object({
  concept: z.string(),
  userQuestion: z.string(),
});

const GenerateCodeCompletionInputSchema = z.object({
  codeContext: z.string(),
  language: z.string(),
});

// The actions now use runFlow to call the Genkit API endpoint
export async function getHint(input: z.infer<typeof GenerateHintInputSchema>) {
  try {
    const { hint } = await runFlow(generateHint, input);
    return hint;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a hint at this time.';
  }
}

export async function getClarification(input: z.infer<typeof GenerateClarificationInputSchema>) {
  try {
    const { clarification } = await runFlow(generateClarification, input);
    return clarification;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a clarification at this time.';
  }
}

export async function getCodeCompletion(input: z.infer<typeof GenerateCodeCompletionInputSchema>) {
  try {
    const { completion } = await runFlow(generateCodeCompletion, input);
    return completion;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a code completion at this time.';
  }
}

export async function generateDrillAction(prompt: string) {
    try {
        const result = await runFlow(generateDrillFromPrompt, { prompt });
        
        // The debug flow now returns the final JSON directly if successful
        if (result.finalJson) {
            return result.finalJson;
        }

        // If there was an error in the flow, it will be in the error property
        if (result.error) {
            console.error("Error from AI flow:", result.error);
            console.error("Raw creative text:", result.rawCreativeText);
            return { error: 'Failed to generate drill. The AI returned invalid data.' };
        }
        
        return { error: 'Failed to generate drill. An unknown error occurred.' };

    } catch (error) {
        console.error("Error calling generateDrillAction:", error);
        return { error: 'Failed to generate drill. Please check the server logs.' };
    }
}
