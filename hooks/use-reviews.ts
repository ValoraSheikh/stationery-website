"use client"

import useSWR, { mutate } from "swr"
import type { Review } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useReviews() {
  const { data, error, isLoading } = useSWR<{ reviews: Review[] }>("/api/admin/review", fetcher, {
    revalidateOnFocus: false,
  })

  async function deleteOne(id: string) {
    const res = await fetch(`/api/admin/review/${id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const e = await res.json().catch(() => ({}))
      throw new Error(e?.error || "Failed to delete review")
    }
    await mutate("/api/admin/review")
  }

  async function deleteMany(ids: string[]) {
    // Sequentially delete to keep API simple
    for (const id of ids) {
      await deleteOne(id)
    }
  }

  return {
    reviews: data?.reviews || [],
    isLoading,
    isError: !!error,
    deleteOne,
    deleteMany,
  }
}