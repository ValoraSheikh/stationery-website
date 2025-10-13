"use client"

import Image from "next/image"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Review } from "@/lib/types"
import { cn } from "@/lib/utils"

function rowTone(rating: number) {
  // Use token-based colors:
  // high >=4 -> chart-2 subtle
  // mid ==3  -> accent subtle
  // low <=2  -> destructive subtle
  if (rating >= 4) return "bg-chart-2/10"
  if (rating === 3) return "bg-accent/20"
  return "bg-destructive/10"
}

export function ReviewTable({
  reviews,
  page,
  pageSize,
  onPageChange,
  onView,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAllOnPage,
  totalCount,
}: {
  reviews: Review[]
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onView: (review: Review) => void
  onDelete: (id: string) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAllOnPage: (ids: string[]) => void
  totalCount: number
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = reviews.slice(start, end)
  const pageIds = pageItems.map((r) => r._id)
  const allOnPageSelected = pageIds.every((id) => selectedIds.has(id)) && pageIds.length > 0

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableCaption>Manage user reviews</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allOnPageSelected}
                onCheckedChange={() => onToggleSelectAllOnPage(pageIds)}
                aria-label="Select all on page"
              />
            </TableHead>
            <TableHead>Reviewer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Review</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((r) => (
            <TableRow key={r._id} className={cn("transition-colors", rowTone(r.rating))}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(r._id)}
                  onCheckedChange={() => onToggleSelect(r._id)}
                  aria-label={`Select review ${r._id}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{r.userId.name}</span>
                  <span className="text-xs text-muted-foreground">{r.userId.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {r.productId.images?.[0] ? (
                    <Image
                      src={r.productId.images?.[0] || "/placeholder.svg"}
                      alt="Product"
                      width={32}
                      height={32}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-accent" aria-hidden />
                  )}
                  <span className="font-medium">{r.productId.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span aria-label={`Rating ${r.rating} out of 5`}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </TableCell>
              <TableCell className="max-w-[360px]">
                <span className="truncate block">{r.comment}</span>
              </TableCell>
              <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onView(r)} className="rounded-lg">
                  View
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-lg">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete review?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(r._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}

          {pageItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No reviews found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between p-4">
        <div className="text-sm text-muted-foreground">
          Showing {pageItems.length > 0 ? start + 1 : 0}–{Math.min(end, totalCount)} of {totalCount}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious aria-label="Previous page" onClick={() => onPageChange(Math.max(1, page - 1))} />
            </PaginationItem>
            {Array.from({ length: totalPages })
              .slice(0, 5)
              .map((_, idx) => {
                const p = idx + 1
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => onPageChange(p)}
                      aria-label={`Go to page ${p}`}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
            <PaginationItem>
              <PaginationNext aria-label="Next page" onClick={() => onPageChange(Math.min(totalPages, page + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}