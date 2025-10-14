/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useReviews } from "@/hooks/use-reviews";
import { SummaryCards } from "./summary-cards";
import {
  FiltersSection,
  type RatingFilter,
  type SortBy,
} from "./filters-section";
import { ReviewTable } from "./review-table";
import type { Review } from "@/lib/types";
import { ReviewDetailDialog } from "./review-detail-dialog";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ReviewsPage() {
  const { reviews, isLoading, isError, deleteOne, deleteMany } = useReviews();

  // Filters state
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReview, setDetailReview] = useState<Review | null>(null);

  function resetFilters() {
    setSearch("");
    setRating("all");
    setFromDate(undefined);
    setToDate(undefined);
    setSortBy("newest");
    setPage(1);
  }

  const safeReviews = useMemo(() => {
    // ✅ Only check for 'user' and 'product' (not userId/productId)
    return reviews.filter((r) => r?.user && r?.product);
  }, [reviews]);

  console.log("Here I am getting reviews", reviews);
  // Derived filtered + sorted reviews
  const filtered = useMemo(() => {
    let list = safeReviews.slice(); // ✅ Changed from reviews.slice()

    console.log("Here is empty", list);
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.product.name.toLowerCase().includes(q) || // ✅ Change productId to product
          r.user.name.toLowerCase().includes(q) || // ✅ Change userId to user
          r.user.email.toLowerCase().includes(q) // ✅ Change userId to user
      );
    }
    if (rating !== "all") {
      const n = Number(rating);
      list = list.filter((r) => r.rating === n);
    }
    if (fromDate) {
      const fd = new Date(fromDate).getTime();
      list = list.filter((r) => new Date(r.createdAt).getTime() >= fd);
    }
    if (toDate) {
      const td = new Date(toDate).getTime();
      list = list.filter((r) => new Date(r.createdAt).getTime() <= td);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return list;
  }, [search, rating, fromDate, toDate, sortBy, safeReviews]);

  // Stats
  const { total, avg, lowCount } = useMemo(() => {
    const total = filtered.length;
    const avg = total
      ? filtered.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;
    const lowCount = filtered.filter((r) => r.rating <= 2).length;
    return { total, avg, lowCount };
  }, [filtered]);

  function openDetail(r: Review) {
    setDetailReview(r);
    setDetailOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteOne(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast("Review deleted");
    } catch (e: any) {
      toast("Failed to delete");
    }
  }

  async function handleBulkDelete(ids: string[]) {
    try {
      await deleteMany(ids);
      setSelectedIds(new Set());
      toast("Selected reviews deleted");
    } catch (e: any) {
      toast("Failed to delete selected");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage(ids: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-pretty">
          Reviews Management
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <SummaryCards total={total} avgRating={avg} lowCount={lowCount} />
        )}
      </header>

      <FiltersSection
        search={search}
        onSearchChange={setSearch}
        rating={rating}
        onRatingChange={setRating}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={resetFilters}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              {/* <Button
                variant="destructive"
                disabled={selectedIds.size === 0}
                className="rounded-lg"
              >
                Delete Selected
              </Button> */}
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete selected reviews?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. {selectedIds.size} review(s)
                  will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleBulkDelete(Array.from(selectedIds))}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isLoading && (
          <div className="grid gap-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load reviews.</p>
        )}

        {!isLoading && !isError && (
          <>
            <ReviewTable
              reviews={filtered}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onView={openDetail}
              onDelete={handleDelete}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAllOnPage={toggleSelectAllOnPage}
              totalCount={filtered.length}
            />

            <ReviewDetailDialog
              open={detailOpen}
              onOpenChange={setDetailOpen}
              review={detailReview}
              onDelete={(id) => {
                setDetailOpen(false);
                handleDelete(id);
              }}
            />
          </>
        )}
      </section>
    </main>
  );
}
