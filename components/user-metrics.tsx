"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Metrics = {
  totalUsers: number
  totalAdmins: number
  googleSignups: number
}

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
  const { data } = useSWR<Metrics>("/api/users/metrics", fetcher)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard label="Total Users" value={data?.totalUsers ?? 0} />
      <MetricCard label="Total Admins" value={data?.totalAdmins ?? 0} />
      <MetricCard label="Google Signups" value={data?.googleSignups ?? 0} />
    </div>
  )
}
