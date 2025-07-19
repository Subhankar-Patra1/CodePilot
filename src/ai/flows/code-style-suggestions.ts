// 'use server'
'use server';
/**
 * @fileOverview Provides code style suggestions based on the input code and specified language and strictness.
 *
 * - codeStyleSuggestions - A function that suggests code style improvements.
 * - CodeStyleSuggestionsInput - The input type for the codeStyleSuggestions function.
 * - CodeStyleSuggestionsOutput - The return type for the codeStyleSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeStyleSuggestionsInputSchema = z.object({
  code: z.string().describe('The code snippet to review.'),
  language: z.string().describe('The programming language of the code.'),
  strictness: z
    .enum(['lenient', 'moderate', 'strict'])
    .describe('The strictness level of the code review.'),
});
export type CodeStyleSuggestionsInput = z.infer<typeof CodeStyleSuggestionsInputSchema>;

const CodeStyleSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of code style suggestions.'),
});
export type CodeStyleSuggestionsOutput = z.infer<typeof CodeStyleSuggestionsOutputSchema>;

export async function codeStyleSuggestions(input: CodeStyleSuggestionsInput): Promise<CodeStyleSuggestionsOutput> {
  return codeStyleSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeStyleSuggestionsPrompt',
  input: {schema: CodeStyleSuggestionsInputSchema},
  output: {schema: CodeStyleSuggestionsOutputSchema},
  prompt: `You are a senior software engineer reviewing code for style and best practices.

You will receive a code snippet, the programming language it is written in, and a strictness level for the review.

Based on the language and strictness, provide a list of suggestions for improving the code style.

Language: {{{language}}}
Strictness: {{{strictness}}}

Code:
```{{{language}}}```
{{{code}}}
```

Suggestions:
`, // Ensure that it's a single backtick.
});

const codeStyleSuggestionsFlow = ai.defineFlow(
  {
    name: 'codeStyleSuggestionsFlow',
    inputSchema: CodeStyleSuggestionsInputSchema,
    outputSchema: CodeStyleSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
