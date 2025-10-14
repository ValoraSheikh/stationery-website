"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import type { Review } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-label={`Rating: ${rating} out of 5`} className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? "text-primary" : "text-muted-foreground"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewDetailDialog({
  open,
  onOpenChange,
  review,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review?: Review | null;
  onDelete: (id: string) => void;
}) {
  if (!review) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-pretty">Review Details</DialogTitle>
          <DialogDescription>
            Inspect the full review and related info.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <section>
            <h4 className="font-medium">User</h4>
            <p className="text-sm text-muted-foreground">
              {review.user.name} — {review.user.email}
            </p>
          </section>

          <Separator />

          <section className="flex items-center gap-3">
            <div className="shrink-0">
              {review.product.image ? (
                <Image
                  src={review.product.image || "/placeholder.svg"}
                  alt={review.product.name || "Product thumbnail"}
                  width={48}
                  height={48}
                  className="rounded-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-accent" aria-hidden />
              )}
            </div>

            <div>
              <h4 className="font-medium">Product</h4>
              <p className="text-sm text-muted-foreground">
                {review.product.name}
              </p>
            </div>
          </section>

          <Separator />

          <section className="grid gap-2">
            <h4 className="font-medium">Review</h4>
            <Stars rating={review.rating} />
            <p className="text-sm leading-relaxed">{review.comment}</p>
            <p className="text-sm">Text: {review.text}</p>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(review.date).toLocaleString()}
              {review.updatedAt
                ? ` • Updated: ${new Date(review.updatedAt).toLocaleString()}`
                : ""}
            </p>
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => onDelete(review._id)}
            className="rounded-lg"
          >
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
