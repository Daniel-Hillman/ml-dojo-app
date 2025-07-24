import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-completion.ts';
import '@/ai/flows/generate-clarification.ts';
import '@/ai/flows/generate-hint.ts';