"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import UserMetrics from "./user-metrics"
import UserFilters from "./user-filters"
import UserTable from "./user-table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export type Provider = "google" | "credentials"
export type Role = "user" | "admin"

export interface User {
  id: string
  name: string
  email: string
  provider: Provider
  role: Role
  avatarUrl?: string
  createdAt: string
  lastActive: string
}

export default function UsersClient() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<Role | "all">("all")
  const [provider, setProvider] = useState<Provider | "all">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<"createdAt">("createdAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (role !== "all") params.set("role", role)
    if (provider !== "all") params.set("provider", provider)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    params.set("sort", sortBy)
    params.set("order", order)
    return params.toString()
  }, [search, role, provider, page, pageSize, sortBy, order])

  const { data, isLoading, mutate } = useSWR<{ users: User[]; total: number; page: number; pageSize: number }>(
    `/api/users?${query}`,
    fetcher,
    { keepPreviousData: true },
  )

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.total / (data.pageSize || 1)))
  }, [data])

  const onReset = () => {
    setSearch("")
    setRole("all")
    setProvider("all")
    setPage(1)
    setPageSize(10)
    setSortBy("createdAt")
    setOrder("desc")
  }

  const refreshAll = async () => {
    await Promise.all([mutate(), globalMutate("/api/users/metrics")])
  }

  return (
    <section className="space-y-6">
      <UserMetrics />

      <Card className={cn("border bg-card")}>
        <CardContent className="p-4 md:p-6 space-y-4">
          <UserFilters
            search={search}
            onSearchChange={(v) => {
              setPage(1)
              setSearch(v)
            }}
            role={role}
            onRoleChange={(v) => {
              setPage(1)
              setRole(v)
            }}
            provider={provider}
            onProviderChange={(v) => {
              setPage(1)
              setProvider(v)
            }}
            onReset={onReset}
          />

          <UserTable
            data={data?.users ?? []}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            totalPages={totalPages}
            sortBy={sortBy}
            order={order}
            onChangePage={setPage}
            onChangePageSize={(n) => {
              setPage(1)
              setPageSize(n)
            }}
            onToggleSort={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            onView={async (id) => {
              /* handled in table with dialog */
            }}
            onEditRole={async (id, nextRole) => {
              const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: nextRole }),
              })
              if (!res.ok) {
                toast("Failed to update role")
                return
              }
              toast("Role updated")
              await refreshAll()
            }}
            onDelete={async (id) => {
              const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
              if (!res.ok) {
                toast("Failed to delete user")
                return
              }
              toast("User deleted")
              // stay on same page; adjust if last item deleted and page > 1
              await refreshAll()
            }}
          />
        </CardContent>
      </Card>
    </section>
  )
}
