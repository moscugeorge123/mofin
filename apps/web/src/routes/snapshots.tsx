import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Camera } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DashboardLayout } from "../components/dashboard-layout"
import { EmptyState } from "../components/empty-state"
import { SnapshotCard } from "../components/snapshot-card"
import { useDeleteSnapshot, useSnapshots } from "../hooks/use-snapshots"
import { useUser } from "../hooks/use-user"
import { authService } from "../services/auth.service"
import type { Snapshot } from "../types/snapshot"

export const Route = createFileRoute("/snapshots")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: SnapshotsPage,
})

function SnapshotsPage() {
  const navigate = useNavigate()
  const user = useUser()
  const { data: snapshots, isLoading, error } = useSnapshots()
  const deleteMutation = useDeleteSnapshot()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [snapshotToDelete, setSnapshotToDelete] = useState<
    Snapshot | undefined
  >()

  const currentUserId = user?.id ?? ""

  const handleCardClick = (snapshot: Snapshot) => {
    navigate({ to: "/snapshots/$id", params: { id: snapshot._id } })
  }

  const handleDeleteClick = (e: React.MouseEvent, snapshot: Snapshot) => {
    e.stopPropagation()
    setSnapshotToDelete(snapshot)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!snapshotToDelete) return
    try {
      await deleteMutation.mutateAsync(snapshotToDelete._id)
      toast.success("Snapshot deleted")
      setDeleteDialogOpen(false)
      setSnapshotToDelete(undefined)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete snapshot")
    }
  }

  return (
    <DashboardLayout
      currentPath="/snapshots"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Snapshots", isCurrentPage: true },
      ]}
    >
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{snapshotToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Snapshots
          </CardTitle>
          <CardDescription>
            Frozen views of your transaction groups — yours and shared with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-destructive p-4 text-sm text-destructive">
              Error loading snapshots: {error.message}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading snapshots...
              </div>
            </div>
          )}

          {!isLoading && !error && snapshots && (
            <>
              {snapshots.length === 0 ? (
                <EmptyState
                  message="No snapshots yet"
                  actionLabel="Go to Groups"
                  onAction={() => navigate({ to: "/groups" })}
                />
              ) : (
                <div className="flex justify-center">
                  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {snapshots.map((snapshot) => {
                      const isOwner = snapshot.ownerId === currentUserId
                      return (
                        <SnapshotCard
                          key={snapshot._id}
                          snapshot={snapshot}
                          isOwner={isOwner}
                          onClick={handleCardClick}
                          onDelete={handleDeleteClick}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
