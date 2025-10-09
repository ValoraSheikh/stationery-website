"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "./users-client"

export default function UserDetailsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user?: User
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Basic profile and activity information.</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>

              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Provider:</span>
                  <Badge variant="secondary" className="capitalize">
                    {user.provider}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge className="capitalize">{user.role}</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-muted-foreground">Last Active</div>
                  <div>{new Date(user.lastActive).toLocaleString()}</div>
                </div>
                <div className="mt-2">
                  <div className="text-muted-foreground">Created At</div>
                  <div>{new Date(user.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
