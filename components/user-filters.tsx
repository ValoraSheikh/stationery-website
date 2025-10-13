/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Role } from "./users-client"

export default function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  provider,
  onProviderChange,
  onReset,
}: {
  search: string
  onSearchChange: (v: string) => void
  role: Role | "all"
  onRoleChange: (v: Role | "all") => void
  provider: "google" | "credentials" | "all"
  onProviderChange: (v: "google" | "credentials" | "all") => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-end">
      <div className="flex-1">
        <Label htmlFor="search" className="text-sm">
          Search
        </Label>
        <Input
          id="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="flex-1 md:max-w-48">
        <Label className="text-sm">Role</Label>
        <Select value={role} onValueChange={(v) => onRoleChange(v as any)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 md:max-w-56">
        <Label className="text-sm">Provider</Label>
        <Select value={provider} onValueChange={(v) => onProviderChange(v as any)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="credentials">Credentials</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}