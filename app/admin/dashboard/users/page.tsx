import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import UsersClient from "@/components/users-client"

export default function Page() {
  return (
    <main className="p-6 md:p-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-pretty">User Management</h1>
        <p className="text-muted-foreground">View, search, and manage users in your application.</p>
      </header>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6 text-muted-foreground">Loading metrics...</CardContent>
          </Card>
        }
      >
        <UsersClient />
      </Suspense>
    </main>
  )
}
