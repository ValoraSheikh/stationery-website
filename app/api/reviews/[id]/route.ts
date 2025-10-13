import { NextResponse } from "next/server"
import { deleteReviewById } from "@/lib/mock-reviews"

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = deleteReviewById(params.id)
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
