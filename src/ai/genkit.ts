import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Ensure the API key is loaded
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is not set');
}

console.log('Genkit initializing with API key:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  logLevel: 'debug',
  model: 'googleai/gemini-1.5-flash-latest',
});
