import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useState } from "react"
import { DashboardLayout } from "../components/dashboard-layout"
import { EmptyState } from "../components/empty-state"
import { authService } from "../services/auth.service"

export const Route = createFileRoute("/groups")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: GroupsPage,
})

function GroupsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <DashboardLayout
      currentPath="/groups"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Groups", isCurrentPage: true },
      ]}
    >
      <div className="mb-4 flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}>Create Group</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>
            Organize and manage your transaction groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            message="No groups available"
            actionLabel="Create Your First Group"
            onAction={() => setDialogOpen(true)}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
