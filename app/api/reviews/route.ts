import { NextResponse } from "next/server"
import { REVIEWS } from "@/lib/mock-reviews"

export async function GET() {
  // In a real app, you would query your database here with filters/pagination.
  return NextResponse.json({ reviews: REVIEWS })
}
