"use server";

/**
 * @fileOverview Provides code quality and vulnerability feedback on code snippets.
 *
 * - codeQualityCritique - A function that accepts code and configuration parameters and returns feedback.
 * - CodeQualityCritiqueInput - The input type for the codeQualityCritique function.
 * - CodeQualityCritiqueOutput - The return type for the codeQualityCritique function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const CodeQualityCritiqueInputSchema = z.object({
  code: z.string().describe("The code snippet to be reviewed."),
  language: z
    .string()
    .describe("The programming language of the code snippet."),
  strictness: z
    .enum(["lenient", "moderate", "strict"])
    .describe("The strictness level of the code review."),
  continuation: z
    .boolean()
    .optional()
    .describe(
      "If true, continue outputting the improved code from where the last response ended."
    ),
  previousCode: z
    .string()
    .optional()
    .describe("The improved code received so far, to be continued."),
});

export type CodeQualityCritiqueInput = z.infer<
  typeof CodeQualityCritiqueInputSchema
>;

const CodeQualityCritiqueOutputSchema = z.object({
  feedback: z
    .string()
    .describe("The code analysis results and suggestions for improvement."),
  correctedCode: z
    .string()
    .optional()
    .describe("The corrected and improved version of the code, if applicable."),
});

export type CodeQualityCritiqueOutput = z.infer<
  typeof CodeQualityCritiqueOutputSchema
>;

export async function codeQualityCritique(
  input: CodeQualityCritiqueInput
): Promise<CodeQualityCritiqueOutput> {
  return codeQualityCritiqueFlow(input);
}

const prompt = ai.definePrompt({
  name: "codeQualityCritiquePrompt",
  input: { schema: CodeQualityCritiqueInputSchema },
  output: { schema: CodeQualityCritiqueOutputSchema },
  prompt: `You are a senior software engineer reviewing this {{{language}}} code.
Strictness level for review: {{{strictness}}}

1. Identify any syntax errors, bugs, or possible exceptions.
2. Suggest best practices for readability and maintainability.
3. Highlight any security risks (e.g., input handling, file access, etc.).
4. Suggest optimizations (memory or runtime).
5. Finally, if applicable and improvements can be made, rewrite the corrected and improved version of the code in the 'correctedCode' field. 

**IMPORTANT:**
- You MUST return the ENTIRE, FULL, and COMPLETE code snippet, not just the parts that were changed. The user needs the full code to copy and paste.
- If the improved code is too long to fit in a single response, CONTINUE outputting the remaining code in additional code blocks until the entire code is provided. Do NOT stop until the full code is output.
- If you reach the end of your response and the code is not finished, say "[CONTINUE]" and wait for the user to prompt you to continue. When prompted, output ONLY the remaining code, picking up exactly where you left off, until the full code is complete.
- **Never omit the [CONTINUE] marker if the improved code is not fully output. Only stop when the entire improved code is provided.**
- If you ever reach the model's output limit and the improved code is not finished, you MUST end your response with [CONTINUE] (on a new line by itself).
- Do NOT summarize, do NOT stop, do NOT omit [CONTINUE] if the code is not finished.
- Only stop when the entire improved code is output.
- If no corrections are needed, you can omit the 'correctedCode' field.

{{#if continuation}}
You are continuing the improved code. Here is the improved code so far:
{{{previousCode}}}

Output ONLY the next part of the improved code, picking up exactly where you left off. If the code is still not finished, end with [CONTINUE].
{{else}}
Code:
\`\`\`{{{language}}}\`\`\`
\`\`\`{{{code}}}\`\`\`
{{/if}}

Your feedback should be structured clearly in the 'feedback' field. Ensure any 'correctedCode' provided is well-formatted and complete.
`,
});

export async function codeQualityCritiqueFlow(
  input: CodeQualityCritiqueInput
): Promise<CodeQualityCritiqueOutput> {
  const { output } = await prompt(input);
    return output!;
  }
