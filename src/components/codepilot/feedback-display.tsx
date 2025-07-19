"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Bug,
  Palette,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Sparkles,
  Loader2,
  MessageSquareQuote,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAIExplanation } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Custom accessible light theme
const accessibleLightTheme = {
  'code[class*="language-"]': {
    color: "#232946",
    background: "#fff",
    fontFamily: "Fira Code, Consolas, Menlo, Monaco, monospace",
    fontSize: 15,
    lineHeight: 1.6,
    borderRadius: "8px",
    padding: "1.25rem",
  },
  'pre[class*="language-"]': {
    color: "#232946",
    background: "#fff",
    fontFamily: "Fira Code, Consolas, Menlo, Monaco, monospace",
    fontSize: 15,
    lineHeight: 1.6,
    borderRadius: "8px",
    padding: "1.25rem",
  },
  ".token.keyword": { color: "#0000AA", fontWeight: "bold" },
  ".token.string": { color: "#007700" },
  ".token.number": { color: "#AA5500" },
  ".token.comment": { color: "#777777", fontStyle: "italic" },
  ".token.class-name": { color: "#550088", fontWeight: "bold" },
  ".token.function": { color: "#550088", fontWeight: "bold" },
  ".token.operator": { color: "#232946" },
  ".token.punctuation": { color: "#232946" },
};

interface FeedbackDisplayProps {
  feedback: string | null;
  correctedCode?: string | null;
  isLoading: boolean;
  error: string | null;
  originalCode: string;
  language: string;
  isRealTimeWriting?: boolean; // New prop for real-time writing mode
}

interface FeedbackSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string[];
}

const FEEDBACK_CATEGORIES = [
  {
    id: "bugs",
    title: "Syntax Errors, Bugs & Exceptions",
    icon: Bug,
    match: /^(1\.|Syntax Errors, Bugs, or possible exceptions)/i,
  },
  {
    id: "style",
    title: "Readability & Maintainability",
    icon: Palette,
    match: /^(2\.|Best practices for readability and maintainability)/i,
  },
  {
    id: "security",
    title: "Security Risks",
    icon: ShieldCheck,
    match: /^(3\.|Highlight any security risks)/i,
  },
  {
    id: "optimizations",
    title: "Optimizations",
    icon: Zap,
    match: /^(4\.|Suggest optimizations)/i,
  },
];

// Typewriter effect component for real-time code display
function TypewriterCode({
  code,
  language,
  onComplete,
}: {
  code: string;
  language: string;
  onComplete?: () => void;
}) {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Calculate optimal speed based on code length
  const getTypewriterSpeed = (codeLength: number) => {
    if (codeLength < 1000) return 15; // Fast for small code
    if (codeLength < 5000) return 8; // Medium for medium code
    return 3; // Very fast for large code to avoid long waits
  };

  useEffect(() => {
    if (code && currentIndex < code.length) {
      const speed = getTypewriterSpeed(code.length);
      const timer = setTimeout(() => {
        setDisplayedCode(code.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex >= code.length && onComplete) {
      onComplete();
    }
  }, [code, currentIndex, onComplete]);

  useEffect(() => {
    // Reset when code changes
    setDisplayedCode("");
    setCurrentIndex(0);
  }, [code]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-blue-900 bg-[#f3f6fc] dark:bg-[#232946] p-0">
      <SyntaxHighlighter
        language={language || "python"}
        style={oneDark}
        showLineNumbers
        wrapLines
      >
        {displayedCode}
      </SyntaxHighlighter>
      {currentIndex < code.length && (
        <div className="flex items-center justify-center mt-2">
          <div
            className={`w-2 h-4 bg-green-400 rounded ${
              showCursor ? "opacity-100" : "opacity-30"
            } transition-opacity duration-200`}
          />
          <span className="ml-2 text-sm text-green-600 dark:text-green-400">
            Writing code... ({Math.round((currentIndex / code.length) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}

export function FeedbackDisplay({
  feedback,
  correctedCode,
  isLoading,
  error,
  originalCode,
  language,
  isRealTimeWriting = false, // Default to false
}: FeedbackDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [typewriterComplete, setTypewriterComplete] = useState(false);

  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] = useState(false);

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The improved code has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      });
      console.error("Failed to copy: ", err);
    }
  };

  const handleExplainClick = async (feedbackToExplain: string) => {
    if (!originalCode || !language) {
      toast({
        title: "Cannot Explain",
        description:
          "Missing context (code or language) to generate an explanation.",
        variant: "destructive",
      });
      return;
    }

    setIsExplanationDialogOpen(true);
    setIsExplanationLoading(true);
    setExplanation(null);
    setExplanationError(null);

    const result = await getAIExplanation({
      code: originalCode,
      feedback: feedbackToExplain,
      language: language,
    });

    if (result.error) {
      setExplanationError(result.error);
    } else {
      setExplanation(result.explanation);
    }
    setIsExplanationLoading(false);
  };

  const parsedFeedback = useMemo(() => {
    if (!feedback) return [];
    const sections: FeedbackSection[] = FEEDBACK_CATEGORIES.map((cat) => ({
      ...cat,
      content: [],
    }));
    let currentSection: FeedbackSection | null = null;
    const lines = feedback.split("\n");

    for (const line of lines) {
      let matchedCategory = false;
      for (const category of FEEDBACK_CATEGORIES) {
        if (category.match.test(line.trim())) {
          currentSection = sections.find((s) => s.id === category.id) || null;
          if (currentSection) {
            const cleanLine = line.replace(category.match, "").trim();
            if (cleanLine) currentSection.content.push(cleanLine);
          }
          matchedCategory = true;
          break;
        }
      }
      if (!matchedCategory && currentSection && line.trim()) {
        currentSection.content.push(line.trim());
      } else if (!currentSection && line.trim()) {
        if (
          sections.length > 0 &&
          sections[0].content.length === 0 &&
          !FEEDBACK_CATEGORIES.some((cat) => cat.match.test(line.trim()))
        ) {
          if (sections[0].content.length === 0)
            sections[0].content.push(line.trim());
        }
      }
    }
    return sections.filter((section) => section.content.length > 0);
  }, [feedback]);

  // Reset typewriter state when correctedCode changes
  useEffect(() => {
    setTypewriterComplete(false);
  }, [correctedCode]);

  if (isLoading) {
    return (
      <Card className="w-full mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="text-blue-500 h-6 w-6 animate-pulse" /> AI
            Review & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-1" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4 mb-1" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2 mb-1" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-8 w-1/4 mb-2" />
            {/* Code block skeleton */}
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-blue-900 bg-[#f3f6fc] dark:bg-[#232946] p-0">
              <Skeleton className="h-6 w-full mb-1" />
              <Skeleton className="h-6 w-11/12 mb-1" />
              <Skeleton className="h-6 w-10/12 mb-1" />
              <Skeleton className="h-6 w-9/12 mb-1" />
              <Skeleton className="h-6 w-8/12 mb-1" />
              <Skeleton className="h-6 w-7/12 mb-1" />
              <Skeleton className="h-6 w-6/12 mb-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mt-8 shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-destructive flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2" /> Error Reviewing Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/80 p-4 rounded-md">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!feedback && !correctedCode) {
    return (
      <Card className="w-full mt-8 shadow-lg border-dashed">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">AI Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Submit your code to get AI-powered review feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {parsedFeedback.length > 0 && (
        <Card className="w-full mt-8 shadow-lg border-l-4 border-blue-400 bg-[#f3f6fc] dark:bg-[#181f2a] dark:border-blue-600">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <Sparkles className="text-blue-500 h-6 w-6" /> AI Review &
              Suggestions
            </CardTitle>
            <CardDescription className="text-base text-blue-900/80 dark:text-blue-200/80">
              The AI has provided feedback categorized below. Click to expand or
              ask for an explanation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={parsedFeedback.map((s) => s.id)}
            >
              {parsedFeedback.map((section) => (
                <AccordionItem
                  value={section.id}
                  key={section.id}
                  className="mb-2"
                >
                  <AccordionTrigger className="text-base hover:no-underline">
                    <div className="flex items-center gap-2">
                      <section.icon
                        className={`h-5 w-5 mr-2 ${
                          section.id === "bugs"
                            ? "text-red-500"
                            : section.id === "style"
                            ? "text-blue-500"
                            : section.id === "security"
                            ? "text-green-500"
                            : section.id === "optimizations"
                            ? "text-emerald-500"
                            : ""
                        }`}
                      />
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-white/80 dark:bg-[#232946] rounded-md p-4 border-l-4 border-blue-200 dark:border-blue-700 text-[15px] font-sans text-blue-900 dark:text-blue-100 leading-relaxed">
                      {section.content.map((line, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <ReactMarkdown>{line}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        handleExplainClick(
                          `${section.title}:\n${section.content.join("\n")}`
                        )
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Explain This
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {!parsedFeedback.length && feedback && (
        <Card className="w-full mt-8 shadow-lg border-l-4 border-blue-400 bg-[#f3f6fc] dark:bg-[#181f2a] dark:border-blue-600">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <Sparkles className="text-blue-500 h-6 w-6" /> AI Review &
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/80 dark:bg-[#232946] rounded-md p-4 border-l-4 border-blue-200 dark:border-blue-700 text-[15px] font-sans text-blue-900 dark:text-blue-100 leading-relaxed">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleExplainClick(feedback)}
                  aria-label="Explain this feedback"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Explain This
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Get a detailed AI explanation for this feedback
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      )}

      {correctedCode && (
        <Card className="w-full mt-8 shadow-lg border border-gray-200 dark:border-blue-900 bg-[#f3f6fc] dark:bg-[#181f2a]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline text-2xl flex items-center gap-2 text-green-700 dark:text-green-300">
                <Check className="text-green-500 h-6 w-6" /> Improved Code
                {isRealTimeWriting && !typewriterComplete && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400 animate-pulse">
                    Writing...
                  </span>
                )}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(correctedCode)}
                    disabled={
                      copied || (isRealTimeWriting && !typewriterComplete)
                    }
                    aria-label="Copy improved code to clipboard"
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy improved code to clipboard</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="text-base text-gray-700/80 dark:text-gray-200/80">
              {isRealTimeWriting && !typewriterComplete
                ? "The AI is generating an improved version of your code..."
                : "The AI has provided an improved version of your code snippet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRealTimeWriting && !typewriterComplete ? (
              <TypewriterCode
                code={correctedCode}
                language={language}
                onComplete={() => setTypewriterComplete(true)}
              />
            ) : (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-blue-900 bg-[#f3f6fc] dark:bg-[#232946] p-0">
                <SyntaxHighlighter
                  language={language || "python"}
                  style={oneDark}
                  showLineNumbers
                  wrapLines
                >
                  {correctedCode}
                </SyntaxHighlighter>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <MessageSquareQuote className="mr-2 h-6 w-6" />
              AI Explanation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Here is a more detailed explanation of the feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ScrollArea className="max-h-[60vh] pr-6">
            {isExplanationLoading ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            ) : explanationError ? (
              <div className="text-destructive-foreground bg-destructive/80 p-4 rounded-md">
                {explanationError}
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
