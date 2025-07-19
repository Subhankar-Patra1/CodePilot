
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { StrictnessLevel } from '@/app/actions';

const STORAGE_KEY = 'codepilot-review-history';

export interface Review {
  id: number;
  timestamp: number;
  title?: string;
  code: string;
  language: string;
  strictness: StrictnessLevel;
  feedback: string | null;
  correctedCode: string | null;
}

export function useReviewHistory() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedReviews = localStorage.getItem(STORAGE_KEY);
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      }
    } catch (error) {
      console.error("Failed to load review history from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const getReviews = useCallback((): Review[] => {
    try {
      const storedReviews = localStorage.getItem(STORAGE_KEY);
      return storedReviews ? JSON.parse(storedReviews) : [];
    } catch (error) {
      console.error("Failed to get reviews from localStorage", error);
      return [];
    }
  }, []);
  
  const getReviewById = useCallback((id: number): Review | undefined => {
    const allReviews = getReviews();
    return allReviews.find(review => review.id === id);
  }, [getReviews]);

  const addReview = useCallback((reviewData: Omit<Review, 'id' | 'timestamp' | 'title'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now(), // Use timestamp as a simple unique ID
      timestamp: Date.now(),
      title: `${reviewData.language.charAt(0).toUpperCase() + reviewData.language.slice(1)} Review Snippet`, // Default title
    };

    setReviews(prevReviews => {
      const updatedReviews = [newReview, ...prevReviews];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
      } catch (error) {
        console.error("Failed to save review to localStorage", error);
      }
      return updatedReviews;
    });
  }, []);

  const editReview = useCallback((id: number, title: string) => {
    setReviews(prevReviews => {
      const updatedReviews = prevReviews.map(review => 
        review.id === id ? { ...review, title } : review
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
      } catch (error) {
        console.error("Failed to update review in localStorage", error);
      }
      return updatedReviews;
    });
  }, []);
  
  const deleteReview = useCallback((id: number) => {
    setReviews(prevReviews => {
        const updatedReviews = prevReviews.filter(review => review.id !== id);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
        } catch (error) {
            console.error("Failed to update localStorage after deletion", error);
        }
        return updatedReviews;
    });
  }, []);


  // Ensure component using this hook re-renders when reviews state changes
  useEffect(() => {
    const currentReviews = getReviews();
    setReviews(currentReviews);
  }, [getReviews]);


  return { reviews, isLoaded, addReview, getReviews, getReviewById, deleteReview, editReview };
}
