"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "./users-client"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}

export default function UserMetrics() {
  const { data } = useSWR<User[]>("/api/admin/user", fetcher)

  const totalUsers = data?.length ?? 0
  const totalAdmins = data?.filter(u => u.role === "admin").length ?? 0
  const googleSignups = data?.filter(u => u.provider === "google").length ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard label="Total Users" value={totalUsers} />
      <MetricCard label="Total Admins" value={totalAdmins} />
      <MetricCard label="Google Signups" value={googleSignups} />
    </div>
  )
}