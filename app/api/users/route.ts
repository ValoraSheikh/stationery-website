import { NextResponse } from "next/server"
import { listUsers } from "./data"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? undefined
  const role = (searchParams.get("role") as "user" | "admin" | null) ?? undefined
  const provider = (searchParams.get("provider") as "google" | "credentials" | null) ?? undefined
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Number(searchParams.get("pageSize") ?? "10")
  const sort = (searchParams.get("sort") as "createdAt" | null) ?? "createdAt"
  const order = (searchParams.get("order") as "asc" | "desc" | null) ?? "desc"

  const data = listUsers({
    search,
    role: role ?? undefined,
    provider: provider ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    sort,
    order,
  })

  return NextResponse.json(data)
}
