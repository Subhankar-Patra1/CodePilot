"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CodeInputForm } from "@/components/codepilot/code-input-form";
import { FeedbackDisplay } from "@/components/codepilot/feedback-display";
import {
  getAICodeReview,
  validateCodeLanguage,
  type StrictnessLevel,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useReviewHistory } from "@/hooks/use-review-history";
import type { Review } from "@/hooks/use-review-history";
import {
  SidebarTrigger,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bot, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Head from "next/head";

interface CodeInputFormValues {
  code: string;
  language: string;
  strictness: StrictnessLevel;
  apiKey: string; // Add apiKey
}

export default function CodePilotPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correctedCode, setCorrectedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedCode, setLastSubmittedCode] = useState<string>("");
  const [lastSubmittedLanguage, setLastSubmittedLanguage] =
    useState<string>("");
  const [lastSubmittedStrictness, setLastSubmittedStrictness] =
    useState<StrictnessLevel>("moderate");
  const [lastSubmittedApiKey, setLastSubmittedApiKey] = useState<string>("");
  const [resetKey, setResetKey] = useState<number>(0);
  const [codeChunks, setCodeChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [allImprovedCode, setAllImprovedCode] = useState<string>("");
  const [showContinue, setShowContinue] = useState(false);
  const [isFetchingContinue, setIsFetchingContinue] = useState(false);
  const pathname = usePathname();
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  // Reset form when navigating to root (New Review from sidebar)
  useEffect(() => {
    if (pathname === "/") {
      setResetKey((k) => k + 1);
      setFeedback(null);
      setCorrectedCode(null);
      setError(null);
      setLastSubmittedCode("");
      setLastSubmittedLanguage("");
    }
    // Listen for custom new-review event
    const handleNewReviewEvent = () => {
      setResetKey((k) => k + 1);
      setFeedback(null);
      setCorrectedCode(null);
      setError(null);
      setLastSubmittedCode("");
      setLastSubmittedLanguage("");
    };
    window.addEventListener("new-review", handleNewReviewEvent);
    return () => {
      window.removeEventListener("new-review", handleNewReviewEvent);
    };
  }, [pathname]);

  const { toast } = useToast();
  const { addReview } = useReviewHistory();

  // Onboarding modal for new users (now with 'Do not show again')
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("codepilot-onboarded")
    ) {
      setShowOnboardModal(true);
    }
  }, []);

  const handleDoNotShowAgain = () => {
    localStorage.setItem("codepilot-onboarded", "true");
    setShowOnboardModal(false);
  };

  const handleOpenSettings = () => {
    setShowOnboardModal(false);
    // Open settings dialog if possible
    const settingsBtn = document.querySelector('[aria-label="Settings"]');
    if (settingsBtn) (settingsBtn as HTMLElement).click();
  };

  // Onboarding toast for new users (now with 'Do not show again')
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("codepilot-onboarded")
    ) {
      let toastId: string | number | undefined;
      toastId = toast({
        title: "Welcome to CodePilot!",
        description: (
          <span>
            To use code review, please add your own Gemini API key in{" "}
            <b>Settings</b> (bottom left).
          </span>
        ),
        action: (
          <div className="flex gap-2">
            <button
              className="underline text-blue-600 dark:text-blue-300"
              onClick={() => {
                // Open settings dialog if possible
                const settingsBtn = document.querySelector(
                  '[aria-label="Settings"]'
                );
                if (settingsBtn) (settingsBtn as HTMLElement).click();
              }}
            >
              Open Settings
            </button>
            <button
              className="underline text-gray-500 dark:text-gray-300"
              onClick={() => {
                localStorage.setItem("codepilot-onboarded", "true");
                // Optionally dismiss the toast if your toast system supports it
                if (typeof toast.dismiss === "function" && toastId)
                  toast.dismiss(toastId);
              }}
            >
              Do not show again
            </button>
          </div>
        ),
        duration: 5000,
      });
    }
  }, [toast]);

  // Memoize the chunk processing logic to prevent unnecessary recalculations
  const createChunks = useCallback((code: string) => {
    const lines = code.split("\n");
    const chunks: string[] = [];
    for (let i = 0; i < lines.length; i += 600) {
      chunks.push(lines.slice(i, i + 600).join("\n"));
    }
    return chunks;
  }, []);

  // Memoize the continue button state to prevent unnecessary re-renders
  const continueButtonState = useMemo(
    () => ({
      show: showContinue,
      disabled: isLoading || isFetchingContinue,
      loading: isFetchingContinue,
    }),
    [showContinue, isLoading, isFetchingContinue]
  );

  const handleReviewSubmit = async (values: CodeInputFormValues) => {
    setIsLoading(true);
    setIsFetchingContinue(false);
    setFeedback(null);
    setCorrectedCode(null);
    setError(null);
    setLastSubmittedCode(values.code);
    setLastSubmittedLanguage(values.language);
    setLastSubmittedStrictness(values.strictness);
    setLastSubmittedApiKey(values.apiKey);
    setAllImprovedCode("");
    setCurrentChunkIndex(0);
    setShowContinue(false);

    // Use memoized chunk creation
    const chunks = createChunks(values.code);
    setCodeChunks(chunks);
    // Process the first chunk
    await processChunk(0, chunks, values, true);
  };

  // Process a chunk by index
  const processChunk = async (
    chunkIndex: number,
    chunks: string[],
    values: CodeInputFormValues,
    isFirstChunk: boolean = false
  ) => {
    if (isFirstChunk) {
      setIsLoading(true);
      setIsFetchingContinue(false);
    } else {
      setIsFetchingContinue(true);
    }
    let chunkCode = chunks[chunkIndex];
    let previousImproved = isFirstChunk ? "" : allImprovedCode;
    let fullCorrectedCode = previousImproved;
    let firstResult = null;
    let previousCode = previousImproved;
    let isFirst = true;
    const CONTINUE_REGEX = /\[\s*CONTINUE\s*\](\s*)?/gim;
    let truncatedWarning = false;
    let continueFetching = true;
    while (continueFetching) {
      const result = await getAICodeReview(
        chunkCode,
        values.language,
        values.strictness,
        values.apiKey,
        !isFirst, // continuation: true after first call
        previousCode || undefined
      );
      if (result.error) {
        setError(result.error);
        setFeedback(null);
        setCorrectedCode(null);
        setIsLoading(false);
        setIsFetchingContinue(false);
        return;
      }
      if (isFirst && isFirstChunk) {
        setFeedback(result.feedback);
        firstResult = result;
      }
      let chunk = result.correctedCode || "";
      chunk = chunk.replace(CONTINUE_REGEX, "").trimEnd();
      fullCorrectedCode += chunk;
      previousCode = fullCorrectedCode;
      const foundContinue =
        result.isContinue || CONTINUE_REGEX.test(result.correctedCode || "");
      continueFetching = foundContinue;
      isFirst = false;
    }
    setAllImprovedCode(fullCorrectedCode);
    setCorrectedCode(fullCorrectedCode);
    setIsLoading(false);
    setIsFetchingContinue(false);
    setShowTruncatedWarning(truncatedWarning);

    // If this is the last chunk, save to review history
    if (chunkIndex >= chunks.length - 1) {
      setShowContinue(false);
      // Save the completed review to history
      if (firstResult && fullCorrectedCode) {
        const reviewTitle = `${values.language} Code Review`;
        addReview({
          id: Date.now(), // Simple ID generation
          code: values.code,
          feedback: firstResult.feedback || "",
          correctedCode: fullCorrectedCode,
          language: values.language,
          strictness: values.strictness,
          title: reviewTitle,
          timestamp: new Date().toISOString(),
        });
         toast({
            title: "Review Saved",
          description: "Your code review has been saved to your library.",
          });
      }
    } else {
      // Automatically process the next chunk
      await processChunk(chunkIndex + 1, chunks, values, false);
    }
  };

  // Remove the manual Continue button and handler

  // State for truncated warning
  const [showTruncatedWarning, setShowTruncatedWarning] = useState(false);

  // Custom New Review button handler
  const handleNewReview = (e: React.MouseEvent) => {
    e.preventDefault();
    setResetKey((k) => k + 1);
    setFeedback(null);
    setCorrectedCode(null);
    setError(null);
    setLastSubmittedCode("");
    setLastSubmittedLanguage("");
  };

  return (
    <>
      <Head>
        <title>CodePilot – AI Code Review Tool</title>
        <meta name="description" content="Codepilot will help to analyze error in the code and give improved code and bugs." />
        <link rel="canonical" href="https://your-domain.com/" />
        <meta property="og:title" content="CodePilot – AI Code Review Tool" />
        <meta property="og:description" content="Codepilot will help to analyze error in the code and give improved code and bugs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://your-domain.com/" />
        <meta property="og:image" content="/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CodePilot – AI Code Review Tool" />
        <meta name="twitter:description" content="Codepilot will help to analyze error in the code and give improved code and bugs." />
        <meta name="twitter:image" content="/logo.png" />
      </Head>
      <Dialog open={showOnboardModal} onOpenChange={setShowOnboardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to CodePilot!</DialogTitle>
            <DialogDescription>
              To use code review, please add your own Gemini API key in{" "}
              <b>Settings</b> (bottom left).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <button
              className="bg-primary text-primary-foreground rounded px-4 py-2 hover:bg-primary/90"
              onClick={handleOpenSettings}
            >
              Open Settings
            </button>
            <button
              className="bg-muted text-muted-foreground rounded px-4 py-2 hover:bg-muted/80 border"
              onClick={handleDoNotShowAgain}
            >
              Do not show again
            </button>
          </div>
        </DialogContent>
      </Dialog>
    <div className="flex flex-col min-h-full flex-grow bg-background">
        {(isLoading || isFetchingContinue) && (
          <div className="fixed top-0 left-0 w-full z-[9999]">
            <Progress indeterminate />
          </div>
        )}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
        <SidebarTrigger />
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-headline">CodePilot</span>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="space-y-8">
            <CodeInputForm
              onSubmit={handleReviewSubmit}
              isLoading={isLoading}
              resetKey={resetKey}
            />
          <FeedbackDisplay 
            feedback={feedback} 
              correctedCode={isFetchingContinue ? null : allImprovedCode}
              isLoading={isLoading || isFetchingContinue}
            error={error}
            originalCode={lastSubmittedCode}
            language={lastSubmittedLanguage}
              isRealTimeWriting={isFetchingContinue}
            />
            {showTruncatedWarning && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>
                  Warning: Improved code may be incomplete
                </AlertTitle>
                <AlertDescription>
                  The improved code may be truncated. Please try again with a
                  smaller snippet or check for missing code at the end.
                </AlertDescription>
              </Alert>
            )}
        </div>
      </main>
    </div>
    </>
  );
}
