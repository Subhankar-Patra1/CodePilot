"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import type { StrictnessLevel } from "@/app/actions";
import React, { useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { detectLanguageAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
];

const STRICTNESS_LEVELS: { value: StrictnessLevel; label: string }[] = [
  { value: "lenient", label: "Lenient" },
  { value: "moderate", label: "Moderate" },
  { value: "strict", label: "Strict" },
];

const formSchema = z.object({
  code: z.string().min(1, "Code snippet cannot be empty."),
  language: z.string().min(1, "Please select a language."),
  strictness: z.enum(["lenient", "moderate", "strict"]),
});

type CodeInputFormValues = z.infer<typeof formSchema>;

interface CodeInputFormProps {
  onSubmit: (values: CodeInputFormValues) => Promise<void>;
  isLoading: boolean;
  resetKey?: number;
}

const getLanguageFromFileExtension = (fileName: string): string | undefined => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return undefined;

  const extToLangMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    py: "python",
    ts: "typescript",
    tsx: "typescript",
    java: "java",
    cs: "csharp",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    c: "c",
    h: "c",
    swift: "swift",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    html: "html",
    htm: "html",
    css: "css",
    sql: "sql",
  };
  return extToLangMap[extension];
};

const GEMINI_API_KEY_PREFIX = "AIzaSy";
const GEMINI_API_KEY_STORAGE = "gemini-api-key";
const GEMINI_API_KEY_LENGTH = 39; // Length of the full API key including prefix

export function CodeInputForm({
  onSubmit,
  isLoading,
  resetKey,
}: CodeInputFormProps) {
  const form = useForm<CodeInputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      language: "javascript",
      strictness: "moderate",
    },
  });

  // Sync form's apiKey value with localStorage on mount, reset, and storage events
  useEffect(() => {
    if (resetKey !== undefined) {
      form.reset({
        code: "",
        language: "javascript",
        strictness: "moderate",
      });
    }
    // Set apiKey from localStorage on mount/reset
    if (typeof window !== "undefined") {
      const apiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
    }
    // Listen for changes to localStorage (Settings save) and update form value
    const onStorage = (e: StorageEvent) => {
      if (e.key === GEMINI_API_KEY_STORAGE) {
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [resetKey]);

  // Also update form's apiKey value immediately after Settings save in this tab
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
    };
    window.addEventListener("focus", checkApiKey);
    return () => window.removeEventListener("focus", checkApiKey);
  }, []);

  const codeValue = form.watch("code");
  const [debouncedCode] = useDebounce(codeValue, 1000); // Increased debounce time for better performance
  const { toast } = useToast();

  const detectLanguage = useCallback(
    async (code: string) => {
      if (code.trim().length < 50) return; // Increased minimum length for better performance
      const supportedLanguages = LANGUAGES.map((l) => l.value);
    const result = await detectLanguageAction(code, supportedLanguages);
    if (result.language) {
        form.setValue("language", result.language, { shouldValidate: true });
      } else {
        toast({
          title: "Language Detection Failed",
          description:
            "Could not detect the language of your code. Please select manually.",
          variant: "destructive",
        });
    }
    },
    [form, toast]
  );

  useEffect(() => {
    if (debouncedCode) {
      detectLanguage(debouncedCode);
    }
  }, [debouncedCode, detectLanguage]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        // 200KB limit for demo
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 200KB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        form.setValue("code", content, {
          shouldValidate: true,
          shouldDirty: true,
        });
        const detectedLanguage = getLanguageFromFileExtension(file.name);
        if (
          detectedLanguage &&
          LANGUAGES.some((lang) => lang.value === detectedLanguage)
        ) {
          form.setValue("language", detectedLanguage);
        } else {
            // If we can't detect from extension, let the AI try
            detectLanguage(content);
        }
      };
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Could not read the uploaded file.",
          variant: "destructive",
        });
      };
      reader.readAsText(file);
    }
     // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (values: CodeInputFormValues) => {
    await onSubmit({ ...values });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Submit Your Code
        </CardTitle>
        <CardDescription>
          Paste your code snippet below, upload a file, select the language and
          review strictness.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code Snippet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your code here or upload a file..."
                      className="min-h-[200px] font-code text-sm"
                      rows={15}
                      {...field}
                      aria-label="Code Snippet Input"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    Paste your code or upload a file. Supports most programming
                    languages.
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="flex-grow mb-6 sm:mb-0">
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                        <FormControl>
                        <SelectTrigger aria-label="Select Language">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Choose the language for your code.
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="strictness"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                    {/* Move label and tooltip above dropdown for alignment */}
                    <div className="flex items-center gap-1 mb-1">
                    <FormLabel>Strictness Level</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="cursor-pointer">
                            <Info
                              className="h-4 w-4 text-muted-foreground"
                              aria-label="What is strictness?"
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs text-xs">
                            <b>Strictness</b> controls how picky the AI is about
                            code quality.
                            <br />
                            <b>Lenient:</b> Only major issues.
                            <br />
                            <b>Moderate:</b> Balanced review.
                            <br />
                            <b>Strict:</b> All possible improvements.
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                        <FormControl>
                        <SelectTrigger aria-label="Select Strictness Level">
                            <SelectValue placeholder="Select strictness" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {STRICTNESS_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                            {level.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Choose how thorough the review should be.
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div>
              <FormLabel htmlFor="file-upload" className="sr-only">
                Upload code file
              </FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Load from File
              </Button>
              <Input 
                id="file-upload"
                type="file" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange} 
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cs,.go,.rs,.php,.rb,.cpp,.cxx,.cc,.c,.h,.swift,.kt,.kts,.scala,.html,.htm,.css,.sql,text/plain"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Review Code"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
    