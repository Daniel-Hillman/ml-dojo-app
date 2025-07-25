import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-completion.ts';
import '@/ai/flows/generate-clarification.ts';
import '@/ai/flows/generate-hint.ts';
import '@/ai/flows/generate-deeper-explanation.ts';
import '@/ai/flows/generate-dynamic-drill.ts';
import '@/ai/flows/generate-drill-from-prompt.ts';
import '@/ai/flows/test-simple-generation.ts';
