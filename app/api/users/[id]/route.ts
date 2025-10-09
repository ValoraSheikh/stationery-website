import { NextResponse } from "next/server"
import { deleteUser, getUser, updateUserRole } from "../data"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = getUser(params.id)
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(user)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const role = body?.role as "user" | "admin" | undefined
  if (!role) return NextResponse.json({ error: "Missing role" }, { status: 400 })
  const updated = updateUserRole(params.id, role)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const ok = deleteUser(params.id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
