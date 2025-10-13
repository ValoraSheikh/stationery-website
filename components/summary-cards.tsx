"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SummaryCards({
  total,
  avgRating,
  lowCount,
}: {
  total: number
  avgRating: number
  lowCount: number
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-pretty">Total Reviews</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{total}</CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-pretty">Average Rating</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">
          {avgRating.toFixed(2)} <span className="text-muted-foreground text-base">/ 5</span>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-pretty">Low-Rated (≤ 2)</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{lowCount}</CardContent>
      </Card>
    </section>
  )
}