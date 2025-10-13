import type { Review } from "./types"

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export let REVIEWS: Review[] = [
  {
    id: "r1",
    user: { id: "u1", name: "Alice Johnson", email: "alice@example.com" },
    product: { id: "p1", name: "Noise-Canceling Headphones", image: "/headphones-thumbnail.jpg" },
    rating: 5,
    text: "Fantastic sound quality and comfort. Highly recommend!",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: "r2",
    user: { id: "u2", name: "Ben Carter", email: "ben@domain.com" },
    product: { id: "p2", name: "Smartwatch X2", image: "/smartwatch-thumbnail.jpg" },
    rating: 2,
    text: "Battery life is underwhelming. The UI is sluggish.",
    createdAt: daysAgo(12),
  },
  {
    id: "r3",
    user: { id: "u3", name: "Clara Yang", email: "clara@example.com" },
    product: { id: "p3", name: "4K Monitor Pro", image: "/4k-monitor-thumbnail.jpg" },
    rating: 4,
    text: "Crisp and bright. Great for design work and coding.",
    createdAt: daysAgo(5),
  },
  {
    id: "r4",
    user: { id: "u4", name: "Diego Rivera", email: "diego@shopper.com" },
    product: { id: "p1", name: "Noise-Canceling Headphones", image: "/headphones-thumbnail.jpg" },
    rating: 3,
    text: "Solid value for money, though the clamping force is a bit high.",
    createdAt: daysAgo(20),
  },
  {
    id: "r5",
    user: { id: "u5", name: "Emily Chen", email: "emily@domain.com" },
    product: { id: "p4", name: "Mechanical Keyboard 75%", image: "/keyboard-thumbnail.jpg" },
    rating: 1,
    text: "Keys started double-typing after a week. Disappointed.",
    createdAt: daysAgo(1),
  },
]

export function deleteReviewById(id: string) {
  const before = REVIEWS.length
  REVIEWS = REVIEWS.filter((r) => r.id !== id)
  return before !== REVIEWS.length
}

export function deleteReviewsByIds(ids: string[]) {
  const set = new Set(ids)
  const before = REVIEWS.length
  REVIEWS = REVIEWS.filter((r) => !set.has(r.id))
  return before - REVIEWS.length
}
