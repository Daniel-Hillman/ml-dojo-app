import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// The next() plugin is not needed here; the API route handles the integration.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  model: 'googleai/gemini-1.5-flash-latest',
});
