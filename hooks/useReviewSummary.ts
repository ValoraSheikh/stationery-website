"use client";

import { useEffect, useState } from "react";

interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}

interface UseReviewSummaryReturn extends ReviewSummary {
  loading: boolean;
  error?: string;
}

export const useReviewSummary = (productId: string): UseReviewSummaryReturn => {
  const [summary, setSummary] = useState<ReviewSummary>({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!productId) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/review-summary?productId=${productId}`);
        if (!res.ok) throw new Error("Failed to fetch review summary");
        const data: ReviewSummary = await res.json();
        setSummary({
          averageRating: data.averageRating || 0,
          reviewCount: data.reviewCount || 0,
        });
      } catch (err: unknown) {
        // Safely check if err is an Error
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [productId]);

  return { ...summary, loading, error };
};
