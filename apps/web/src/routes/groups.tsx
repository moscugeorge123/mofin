import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
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
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useState } from "react"
import { toast } from "sonner"
import { DashboardLayout } from "../components/dashboard-layout"
import { EmptyState } from "../components/empty-state"
import { GroupCard } from "../components/group-card"
import { GroupDialog } from "../components/group-dialog"
import { useCategories, useDeleteCategory } from "../hooks/use-categories"
import { authService } from "../services/auth.service"
import type { Category } from "../types/category"

export const Route = createFileRoute("/groups")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: GroupsPage,
})

function GroupsPage() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >()
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<
    Category | undefined
  >()

  const { data: categories, isLoading, error } = useCategories()
  const deleteMutation = useDeleteCategory()

  const handleCreateClick = () => {
    setSelectedCategory(undefined)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const handleCardClick = (category: Category) => {
    navigate({ to: "/groups/$id", params: { id: category._id } })
  }

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteMutation.mutateAsync(categoryToDelete._id)
      toast.success("Group deleted successfully")
      setDeleteDialogOpen(false)
      setCategoryToDelete(undefined)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete group")
    }
  }

  return (
    <DashboardLayout
      currentPath="/groups"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Groups", isCurrentPage: true },
      ]}
    >
      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        mode={dialogMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the group "
              {categoryToDelete?.name}"? This action cannot be undone.
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

      <div className="mb-4 flex items-center justify-end">
        <Button onClick={handleCreateClick}>Create Group</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>
            Organize and manage your transaction groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Error loading groups: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading groups...
              </div>
            </div>
          )}

          {!isLoading && !error && categories && (
            <>
              {categories.length === 0 ? (
                <EmptyState
                  message="No groups available"
                  actionLabel="Create Your First Group"
                  onAction={handleCreateClick}
                />
              ) : (
                <div className="flex justify-center">
                  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categories.map((category) => (
                      <GroupCard
                        key={category._id}
                        category={category}
                        onClick={handleCardClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
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
