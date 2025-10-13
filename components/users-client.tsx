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
  _id: string
  name: string
  email: string
  provider: Provider
  role: Role
  avatar?: string
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

  const { data: allUsers, isLoading, mutate } = useSWR<User[]>(
    `/api/admin/user`,
    fetcher,
    { keepPreviousData: true },
  )

  const filteredUsers = useMemo(() => {
    if (!allUsers) return []
    const lowerSearch = search.toLowerCase()
    return allUsers.filter((u) => {
      if (search && !u.name.toLowerCase().includes(lowerSearch) && !u.email.toLowerCase().includes(lowerSearch)) return false
      if (role !== "all" && u.role !== role) return false
      if (provider !== "all" && u.provider !== provider) return false
      return true
    })
  }, [allUsers, search, role, provider])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (sortBy === "createdAt") {
        const da = new Date(a.createdAt).getTime()
        const db = new Date(b.createdAt).getTime()
        return order === "asc" ? da - db : db - da
      }
      return 0
    })
  }, [filteredUsers, sortBy, order])

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice((page - 1) * pageSize, page * pageSize)
  }, [sortedUsers, page, pageSize])

  const total = filteredUsers.length

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize))
  }, [total, pageSize])

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
    await mutate()
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
            data={paginatedUsers}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
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
              const res = await fetch(`/api/admin/user/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, role: nextRole }),
              })
              if (!res.ok) {
                toast("Failed to update role")
                return
              }
              toast("Role updated")
              await refreshAll()
            }}
            onDelete={async (id) => {
              const res = await fetch(`/api/admin/user/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id }),
              })
              if (!res.ok) {
                toast("Failed to delete user")
                return
              }
              toast("User deleted")
              // stay on same page; adjust if last item deleted and page > 1
              await refreshAll()
              // Optional adjustment: check if page needs to be reduced
              if (page > 1 && (page - 1) * pageSize >= filteredUsers.length) {
                setPage(page - 1)
              }
            }}
          />
        </CardContent>
      </Card>
    </section>
  )
}