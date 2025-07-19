import { config } from 'dotenv';
config();

import '@/ai/flows/code-style-suggestions.ts';
import '@/ai/flows/generate-code-explanation.ts';
import '@/ai/flows/code-quality-critique.ts';
import '@/ai/flows/find-relevant-reviews.ts';
import '@/ai/flows/detect-language.ts';
