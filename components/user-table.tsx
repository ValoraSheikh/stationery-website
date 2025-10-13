"use client"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Ellipsis, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ConfirmDialog from "./confirm-dialog"
import UserDetailsDialog from "./user-details-dialog"
import type { User, Role } from "./users-client"
import { cn } from "@/lib/utils"

export default function UserTable({
  data,
  isLoading,
  page,
  pageSize,
  total,
  totalPages,
  order,
  onChangePage,
  onChangePageSize,
  onToggleSort,
  onEditRole,
  onDelete,
}: {
  data: User[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
  sortBy: "createdAt"
  order: "asc" | "desc"
  onChangePage: (p: number) => void
  onChangePageSize: (n: number) => void
  onToggleSort: () => void
  onView: (id: string) => void | Promise<void>
  onEditRole: (id: string, nextRole: Role) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<User | undefined>(undefined)

  const handleView = (u: User) => {
    setSelected(u)
    setDetailsOpen(true)
  }

  const handleDelete = (u: User) => {
    setSelected(u)
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]">Avatar</TableHead>
              <TableHead className="min-w-[180px]">Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Provider</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="cursor-pointer" onClick={onToggleSort}>
                <div className="inline-flex items-center gap-1">
                  Joined
                  <ArrowUpDown className={cn("h-4 w-4 text-muted-foreground", order === "desc" ? "rotate-180" : "")} />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((u) => (
                <TableRow key={u._id} className="hover:bg-muted/50">
                  <TableCell>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar || "/placeholder.svg"} alt={u.name} />
                      <AvatarFallback>{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium leading-none">{u.name}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{u.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    <Badge variant="secondary">{u.provider}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select value={u.role} onValueChange={(v) => onEditRole(u._id, v as Role)}>
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleView(u)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRole(u._id, u.role === "admin" ? "user" : "admin")}>
                          {u.role === "admin" ? "Set as User" : "Set as Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(u)}>
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} • {total.toLocaleString()} total
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => onChangePageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onChangePage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Button
              size="sm"
              onClick={() => onChangePage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <UserDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} user={selected} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete user?"
        description="This action is permanent and cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (!selected) return
          await onDelete(selected._id)
        }}
      />
    </div>
  )
}