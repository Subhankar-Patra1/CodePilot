'use server';

/**
 * @fileOverview Detects the programming language of a given code snippet.
 *
 * - detectLanguage - A function that accepts a code snippet and returns the detected language.
 * - DetectLanguageInput - The input type for the detectLanguage function.
 * - DetectLanguageOutput - The return type for the detectLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLanguageInputSchema = z.object({
  code: z.string().describe('The code snippet to be analyzed.'),
  supportedLanguages: z
    .array(z.string())
    .describe(
      'An array of supported language values to choose from (e.g., ["javascript", "python", "typescript"]).'
    ),
});
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectLanguageOutputSchema = z.object({
  language: z
    .string()
    .optional()
    .describe('The detected language value (e.g., "python"). If no language is detected, this can be omitted.'),
});
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

export async function detectLanguage(input: DetectLanguageInput): Promise<DetectLanguageOutput> {
  return detectLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectLanguagePrompt',
  input: {schema: DetectLanguageInputSchema},
  output: {schema: DetectLanguageOutputSchema},
  prompt: `Analyze the following code snippet and identify its programming language.

Your response must be one of the following supported language values: {{{json supportedLanguages}}}

If you are confident in the language, return it in the 'language' field. If the code is too short, ambiguous, or not a recognized language from the list, omit the 'language' field.

Code:
\`\`\`
{{{code}}}
\`\`\`
`,
});

const detectLanguageFlow = ai.defineFlow(
  {
    name: 'detectLanguageFlow',
    inputSchema: DetectLanguageInputSchema,
    outputSchema: DetectLanguageOutputSchema,
  },
  async input => {
    // If the code is very short, don't bother calling the AI.
    if (input.code.trim().length < 20) {
      return {language: undefined};
    }
    const {output} = await prompt(input);
    return output!;
  }
);
