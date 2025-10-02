"use client";

import { useEffect, useState } from "react";

interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}

interface UseReviewSummaryMultiReturn {
  summaries: Record<string, ReviewSummary>;
  loading: boolean;
  error?: string;
}

export const useReviewSummaryMulti = (productIds: string[]): UseReviewSummaryMultiReturn => {
  const [summaries, setSummaries] = useState<Record<string, ReviewSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!productIds || productIds.length === 0) return;

    const fetchSummaries = async () => {
      setLoading(true);
      try {
        const ids = productIds.join(",");
        const res = await fetch(`/api/review-summary-multi?productIds=${ids}`);
        if (!res.ok) throw new Error("Failed to fetch review summaries");

        const data: Record<string, ReviewSummary> = await res.json();
        setSummaries(data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchSummaries();
  }, [productIds]);

  return { summaries, loading, error };
};
