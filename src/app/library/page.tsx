"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useReviewHistory, type Review } from "@/hooks/use-review-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Trash2, Search, X, Loader2, Pencil, Bot } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getSemanticSearchResults } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryPage() {
  const {
    reviews: allReviews,
    isLoaded,
    deleteReview,
    editReview,
  } = useReviewHistory();
  const { toast } = useToast();

  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State for the edit title dialog
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (isSearchActive) {
        handleSearch();
    } else {
        setDisplayedReviews(allReviews);
    }
  }, [allReviews, isSearchActive]);

  const handleDelete = (id: number) => {
    deleteReview(id);
    toast({
        title: "Review Deleted",
        description: "The review has been removed from your library.",
    });
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setNewTitle(review.title || "");
  };

  const handleTitleSave = () => {
    if (editingReview && newTitle.trim()) {
      editReview(editingReview.id, newTitle.trim());
      toast({
        title: "Title Updated",
        description: "The review title has been saved.",
      });
      setEditingReview(null);
      setNewTitle("");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a query to search.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    setIsSearchActive(true);
    const result = await getSemanticSearchResults(searchQuery, allReviews);
    setIsSearching(false);

    if (result.error) {
      toast({
        title: "Search Error",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.relevantReviewIds) {
      const filteredReviews = allReviews.filter((review) =>
        result.relevantReviewIds!.includes(review.id)
      );
      const orderedReviews = result
        .relevantReviewIds!.map((id) =>
          filteredReviews.find((r) => r.id === id)
        )
        .filter(Boolean) as Review[];
      setDisplayedReviews(orderedReviews);
       if (orderedReviews.length === 0) {
        toast({
            title: "No Results",
            description: "No relevant reviews found for your query.",
        });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
      setIsSearchActive(false);
      setDisplayedReviews(allReviews);
  };
  
  if (!isLoaded) {
    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden -mx-4 mb-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2 font-semibold">
                    <Bot className="h-6 w-6 text-primary" />
                    <span className="font-headline">CodePilot</span>
                </div>
            </header>
        <h1 className="text-3xl font-headline font-bold mb-8">
          Review Library
        </h1>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
        </main>
    );
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
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-headline font-bold">Review Library</h1>
            {allReviews.length > 0 && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Search className="mr-2 h-4 w-4" />
                        Search Reviews
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>AI-Powered Search</AlertDialogTitle>
                    <AlertDialogDescription>
                    Use natural language to search your review history. For
                    example, "how did I handle authentication in Python?"
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                <div className="flex items-center space-x-2 mb-6 mt-2">
                        <Input 
                            ref={searchInputRef}
                            placeholder="Search query..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                      if (e.key === "Enter") {
                                    handleSearch();
                                }
                            }}
                        />
                    </div>
                    <AlertDialogFooter>
                  <AlertDialogCancel className="px-5 py-2">Close</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-5 py-2"
                  >
                    {isSearching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                        Search
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
        
        {isSearchActive && (
            <div className="flex items-center justify-between bg-secondary p-3 rounded-lg mb-6">
                <p className="text-sm text-secondary-foreground">
              Showing results for:{" "}
              <span className="font-semibold">"{searchQuery}"</span>
                </p>
                <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Search
                </Button>
            </div>
        )}

        {displayedReviews.length === 0 ? (
            <Card className="w-full mt-8 border-dashed flex flex-col items-center justify-center text-center py-12 sm:py-20 px-4">
                <Library className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="font-headline text-2xl">
              {isSearchActive ? "No Matching Reviews" : "Your Library is Empty"}
                </CardTitle>
                <CardDescription className="mt-2 max-w-sm">
                    {isSearchActive 
                        ? "Try a different search query to find what you're looking for."
                : "Completed code reviews will appear here. Submit your first code review to get started."}
                </CardDescription>
                <Button asChild className="mt-6">
                    <Link href="/">Submit a Review</Link>
                </Button>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedReviews.map((review) => (
                <Card key={review.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start">
                    <CardTitle className="font-headline capitalize pr-2">
                      {review.title || `${review.language} Review`}
                    </CardTitle>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleEditClick(review)}
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit title</span>
                        </Button>
                        </AlertDialogTrigger>
                    </AlertDialog>
                    </div>
                    <CardDescription>
                    Reviewed{" "}
                    {formatDistanceToNow(new Date(review.timestamp), {
                      addSuffix: true,
                    })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <pre className="bg-secondary p-3 rounded-md overflow-hidden text-sm font-code text-secondary-foreground whitespace-pre-wrap h-24 truncate">
                        {review.code}
                    </pre>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button asChild variant="default">
                    <Link href={`/library/${review.id}`}>View Review</Link>
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete review</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this code review from your history.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(review.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
                </Card>
            ))}
            </div>
        )}

        {/* Edit Title Dialog */}
        {editingReview && (
          <AlertDialog
            open={!!editingReview}
            onOpenChange={() => setEditingReview(null)}
          >
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Edit Review Title</AlertDialogTitle>
                    <AlertDialogDescription>
                        Give this review a descriptive title to easily find it later.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
              <div className="grid gap-2 mb-6 mt-2">
                        <Label htmlFor="title-input">Title</Label>
                        <Input
                            id="title-input"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                <AlertDialogCancel className="px-5 py-2">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleTitleSave} className="px-5 py-2">
                  Save
                </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        </main>
    </div>
  );
}
