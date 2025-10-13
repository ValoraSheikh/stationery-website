"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type RatingFilter = "all" | "1" | "2" | "3" | "4" | "5"
export type SortBy = "newest" | "oldest" | "highest" | "lowest"

export function FiltersSection({
  className,
  search,
  onSearchChange,
  rating,
  onRatingChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  sortBy,
  onSortByChange,
  onReset,
}: {
  className?: string
  search: string
  onSearchChange: (v: string) => void
  rating: RatingFilter
  onRatingChange: (v: RatingFilter) => void
  fromDate?: string
  toDate?: string
  onFromDateChange: (v?: string) => void
  onToDateChange: (v?: string) => void
  sortBy: SortBy
  onSortByChange: (v: SortBy) => void
  onReset: () => void
}) {
  return (
    <Card className={cn("rounded-xl shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-pretty text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product or user"
            className="rounded-lg"
          />
        </div>

        <div>
          <Select value={rating} onValueChange={(v) => onRatingChange(v as RatingFilter)}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 ★</SelectItem>
              <SelectItem value="4">4 ★</SelectItem>
              <SelectItem value="3">3 ★</SelectItem>
              <SelectItem value="2">2 ★</SelectItem>
              <SelectItem value="1">1 ★</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={fromDate || ""}
            onChange={(e) => onFromDateChange(e.target.value || undefined)}
            className="rounded-lg"
          />
          <Input
            type="date"
            value={toDate || ""}
            onChange={(e) => onToDateChange(e.target.value || undefined)}
            className="rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onReset} className="rounded-lg bg-transparent">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}