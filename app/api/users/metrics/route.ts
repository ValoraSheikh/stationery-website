import { NextResponse } from "next/server"
import { getMetrics } from "../data"

export async function GET() {
  const data = getMetrics()
  return NextResponse.json(data)
}
