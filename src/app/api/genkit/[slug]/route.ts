// src/app/api/genkit/[slug]/route.ts
import { genkit } from 'genkit';
import { nextHandler } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure your flows are imported

export const POST = nextHandler();
