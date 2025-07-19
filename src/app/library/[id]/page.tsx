"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useReviewHistory, type Review } from "@/hooks/use-review-history";
import { FeedbackDisplay } from "@/components/codepilot/feedback-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewDetailPage() {
  const params = useParams();
  const { getReviewById } = useReviewHistory();
  const [review, setReview] = useState<Review | undefined | null>(undefined);

  useEffect(() => {
    // In Next.js with App Router, params can be a string or an array of strings.
    // We handle the case where `id` could be an array, though it's unlikely for this route.
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
      const reviewId = parseInt(id, 10);
      if (!isNaN(reviewId)) {
        const foundReview = getReviewById(reviewId);
        setReview(foundReview);
      } else {
        setReview(null);
      }
    }
  }, [params.id, getReviewById]);

  if (review === undefined) {
    return (
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="space-y-4 max-w-2xl mx-auto">
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (review === null) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-full flex-grow bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
        <SidebarTrigger />
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-headline">CodePilot</span>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href="/library" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl capitalize">
                {review.title || `${review.language} Code`}
              </CardTitle>
              <CardDescription>
                The original code snippet submitted for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary p-4 rounded-md overflow-auto max-h-[600px] text-sm font-code text-secondary-foreground whitespace-pre-wrap">
                {review.code}
              </pre>
            </CardContent>
          </Card>

          <FeedbackDisplay
            feedback={review.feedback}
            correctedCode={review.correctedCode}
            isLoading={false}
            error={null}
            originalCode={review.code}
            language={review.language}
          />
        </div>
      </main>
    </div>
  );
}
