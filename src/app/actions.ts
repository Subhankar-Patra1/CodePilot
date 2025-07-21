"use server";

import {
  codeQualityCritique,
  type CodeQualityCritiqueInput,
  type CodeQualityCritiqueOutput,
} from "@/ai/flows/code-quality-critique";
import {
  findRelevantReviews,
  type FindRelevantReviewsInput,
  type FindRelevantReviewsOutput,
} from "@/ai/flows/find-relevant-reviews";
import {
  generateCodeExplanation,
  type GenerateCodeExplanationInput,
  type GenerateCodeExplanationOutput,
} from "@/ai/flows/generate-code-explanation";
import {
  detectLanguage,
  type DetectLanguageInput,
  type DetectLanguageOutput,
} from "@/ai/flows/detect-language";
import type { Review } from "@/hooks/use-review-history";
import { ai } from "@/ai/genkit";
import { z } from "zod";

export type StrictnessLevel = "lenient" | "moderate" | "strict";

interface CodeReviewResult {
  feedback: string | null;
  correctedCode?: string | null;
  error: string | null;
  isContinue?: boolean; // Indicates if [CONTINUE] was detected
}

export async function getAICodeReview(
  code: string,
  language: string,
  strictness: StrictnessLevel,
  continuation?: boolean,
  previousCode?: string
): Promise<CodeReviewResult> {
  try {
    if (!code.trim()) {
      return { feedback: null, error: "Code snippet cannot be empty." };
    }
    if (!language) {
      return { feedback: null, error: "Language must be selected." };
    }

    const input: CodeQualityCritiqueInput = {
      code,
      language,
      strictness,
      continuation,
      previousCode,
    };
    const result: CodeQualityCritiqueOutput = await codeQualityCritique(
      input
    );
    // Detect [CONTINUE] in correctedCode
    const isContinue =
      result.correctedCode && result.correctedCode.includes("[CONTINUE]");
    return {
      feedback: result.feedback,
      correctedCode: result.correctedCode,
      error: null,
      isContinue,
    };
  } catch (e) {
    console.error("Error getting AI code review:", e);
    const errorMessage =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred during code review.";
    // Check for a specific "503 Service Unavailable" error from the API
    if (
      errorMessage.includes("503") ||
      errorMessage.toLowerCase().includes("overloaded")
    ) {
      return {
        feedback: null,
        error:
          "The AI service is currently busy. Please wait a moment and try again.",
      };
    }
    return { feedback: null, error: errorMessage };
  }
}

interface SearchResult {
  relevantReviewIds: number[] | null;
  error: string | null;
}

export async function getSemanticSearchResults(
  query: string,
  reviews: Review[]
): Promise<SearchResult> {
  try {
    if (!query.trim()) {
      return {
        relevantReviewIds: null,
        error: "Search query cannot be empty.",
      };
    }
    if (reviews.length === 0) {
      return { relevantReviewIds: [], error: null };
    }

    const input: FindRelevantReviewsInput = { query, reviews };
    const result: FindRelevantReviewsOutput = await findRelevantReviews(input);

    return { relevantReviewIds: result.relevantReviewIds, error: null };
  } catch (e) {
    console.error("Error getting semantic search results:", e);
    const errorMessage =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred during search.";

    // Check for a specific "503 Service Unavailable" error from the API
    if (
      errorMessage.includes("503") ||
      errorMessage.toLowerCase().includes("overloaded")
    ) {
      return {
        relevantReviewIds: null,
        error:
          "The AI service is currently busy. Please wait a moment and try again.",
      };
    }

    return { relevantReviewIds: null, error: errorMessage };
  }
}

interface ExplanationResult {
  explanation: string | null;
  error: string | null;
}

export async function getAIExplanation(
  input: GenerateCodeExplanationInput
): Promise<ExplanationResult> {
  try {
    const result: GenerateCodeExplanationOutput = await generateCodeExplanation(
      input
    );
    return { explanation: result.explanation, error: null };
  } catch (e) {
    console.error("Error getting AI explanation:", e);
    const errorMessage =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred while generating the explanation.";

    if (
      errorMessage.includes("503") ||
      errorMessage.toLowerCase().includes("overloaded")
    ) {
      return {
        explanation: null,
        error:
          "The AI service is currently busy. Please wait a moment and try again.",
      };
    }

    return { explanation: null, error: errorMessage };
  }
}

interface LanguageDetectionResult {
  language: string | null;
  error: string | null;
}

export async function detectLanguageAction(
  code: string,
  supportedLanguages: string[]
): Promise<LanguageDetectionResult> {
  try {
    const input: DetectLanguageInput = { code, supportedLanguages };
    const result: DetectLanguageOutput = await detectLanguage(input);
    return { language: result.language ?? null, error: null };
  } catch (e) {
    console.error("Error detecting language:", e);
    // Don't bother the user with this error, just fail silently.
    return { language: null, error: "Language detection failed." };
  }
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export async function validateCodeLanguage(
  code: string,
  selectedLanguage: string
): Promise<ValidationResult> {
  try {
    const validationPrompt = ai.definePrompt({
      name: "validateCodeLanguagePrompt",
      input: { schema: z.object({ code: z.string(), language: z.string() }) },
      output: {
        schema: z.object({
          isMatch: z
            .boolean()
            .describe(
              "True if the code appears to be written in the specified language, false otherwise."
            ),
        }),
      },
      prompt: `Does the following code snippet appear to be written in the '{{{language}}}' language? Answer with only true or false.

            Code:
            \`\`\`
            {{{code}}}
            \`\`\`
            `,
    });

    const { output } = await validationPrompt({
      code,
      language: selectedLanguage,
    });

    if (!output) {
      return { isValid: true, error: null }; // Default to true if AI fails
    }

    if (!output.isMatch) {
      return {
        isValid: false,
        error: `The code does not appear to be ${selectedLanguage}. Please select the correct language.`,
      };
    }

    return { isValid: true, error: null };
  } catch (e) {
    console.error("Error validating code language:", e);
    // Fail open - if the validation check has an error, let the review proceed.
    return { isValid: true, error: null };
  }
}
