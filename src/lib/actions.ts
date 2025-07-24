
'use server';

import { generateHint, GenerateHintInput } from '@/ai/flows/generate-hint';
import { generateClarification, GenerateClarificationInput } from '@/ai/flows/generate-clarification';
import { generateCodeCompletion, GenerateCodeCompletionInput } from '@/ai/flows/generate-code-completion';

export async function getHint(input: GenerateHintInput) {
    try {
        const result = await generateHint(input);
        return result.hint;
    } catch (error) {
        console.error(error);
        return 'Sorry, I could not generate a hint at this time.';
    }
}

export async function getClarification(input: GenerateClarificationInput) {
    try {
        const result = await generateClarification(input);
        return result.clarification;
    } catch (error) {
        console.error(error);
        return 'Sorry, I could not generate a clarification at this time.';
    }
}

export async function getCodeCompletion(input: GenerateCodeCompletionInput) {
    try {
        const result = await generateCodeCompletion(input);
        return result.completion;
    } catch (error) {
        console.error(error);
        return 'Sorry, I could not generate a code completion at this time.';
    }
}
