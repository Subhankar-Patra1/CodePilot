// src/ai/flows/generate-code-explanation.ts
'use server';

/**
 * @fileOverview Explains a piece of feedback provided by CodePilot.
 *
 * - generateCodeExplanation - A function that generates an explanation for a piece of code review feedback.
 * - GenerateCodeExplanationInput - The input type for the generateCodeExplanation function.
 * - GenerateCodeExplanationOutput - The return type for the generateCodeExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeExplanationInputSchema = z.object({
  code: z.string().describe('The original code snippet that the feedback is about.'),
  feedback: z.string().describe('The specific feedback text that needs explaining.'),
  language: z.string().describe('The programming language of the code snippet.'),
});
export type GenerateCodeExplanationInput = z.infer<
  typeof GenerateCodeExplanationInputSchema
>;

const GenerateCodeExplanationOutputSchema = z.object({
  explanation: z
    .string()
    .describe('The detailed explanation of the feedback, including why it is important and how to fix it.'),
});
export type GenerateCodeExplanationOutput = z.infer<
  typeof GenerateCodeExplanationOutputSchema
>;

export async function generateCodeExplanation(
  input: GenerateCodeExplanationInput
): Promise<GenerateCodeExplanationOutput> {
  return generateCodeExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeExplanationPrompt',
  input: {schema: GenerateCodeExplanationInputSchema},
  output: {schema: GenerateCodeExplanationOutputSchema},
  prompt: `You are an expert software engineer and a patient teacher. Your task is to explain a piece of code review feedback to a junior developer.

Focus on the specific feedback provided. Explain *why* this feedback is important. You can reference parts of the original code to make your explanation clearer.

Keep your explanation concise, friendly, and educational. Use markdown for formatting if it helps clarity (e.g., for code blocks or bullet points).

Language: {{{language}}}
Original Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Feedback to Explain:
"{{{feedback}}}"

Now, provide the explanation.`,
});

const generateCodeExplanationFlow = ai.defineFlow(
  {
    name: 'generateCodeExplanationFlow',
    inputSchema: GenerateCodeExplanationInputSchema,
    outputSchema: GenerateCodeExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
