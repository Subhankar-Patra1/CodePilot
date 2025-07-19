'use server';

/**
 * @fileOverview Provides AI-powered semantic search for code reviews.
 *
 * - findRelevantReviews - A function that accepts a query and a list of reviews and returns the most relevant review IDs.
 * - FindRelevantReviewsInput - The input type for the findRelevantReviews function.
 * - FindRelevantReviewsOutput - The return type for the findRelevantReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// This schema must match the Review interface in use-review-history.ts
const ReviewSchema = z.object({
    id: z.number(),
    timestamp: z.number(),
    code: z.string(),
    language: z.string(),
    strictness: z.enum(['lenient', 'moderate', 'strict']),
    feedback: z.string().nullable(),
    correctedCode: z.string().nullable(),
});

const FindRelevantReviewsInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
  reviews: z.array(ReviewSchema).describe('The full list of code reviews to search through.'),
});

export type FindRelevantReviewsInput = z.infer<typeof FindRelevantReviewsInputSchema>;

const FindRelevantReviewsOutputSchema = z.object({
  relevantReviewIds: z.array(z.number()).describe('An array of IDs of the reviews that are most relevant to the user\'s query.'),
});

export type FindRelevantReviewsOutput = z.infer<typeof FindRelevantReviewsOutputSchema>;

export async function findRelevantReviews(input: FindRelevantReviewsInput): Promise<FindRelevantReviewsOutput> {
  // If there are no reviews, return an empty array immediately.
  if (input.reviews.length === 0) {
    return { relevantReviewIds: [] };
  }
  return findRelevantReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findRelevantReviewsPrompt',
  input: {schema: FindRelevantReviewsInputSchema},
  output: {schema: FindRelevantReviewsOutputSchema},
  prompt: `You are an intelligent search engine for a user's code review history. Your task is to find the most relevant reviews based on the user's natural language query.

Analyze the user's query and the provided list of reviews. Each review contains the original code, the AI's feedback, and a corrected version of the code.

Return an array of the 'id' fields for the reviews that best answer or relate to the user's query. The reviews should be ordered from most to least relevant. If no reviews are relevant, return an empty array.

User Query:
"{{{query}}}"

Review History (JSON format):
\`\`\`json
{{{json reviews}}}
\`\`\`
`,
});

const findRelevantReviewsFlow = ai.defineFlow(
  {
    name: 'findRelevantReviewsFlow',
    inputSchema: FindRelevantReviewsInputSchema,
    outputSchema: FindRelevantReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
