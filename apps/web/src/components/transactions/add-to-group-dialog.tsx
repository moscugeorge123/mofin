import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useCategories } from "../../hooks/use-categories"
import { categoriesApi } from "../../services/categories.service"
import type { Category } from "../../types/category"

interface AddToGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
}

export function AddToGroupDialog({
  open,
  onOpenChange,
  transactionId,
}: AddToGroupDialogProps) {
  const [search, setSearch] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [succeededIds, setSucceededIds] = useState<Set<string>>(new Set())

  const { data: categories = [], isLoading } = useCategories()

  const filtered = categories.filter((c: Category) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (category: Category) => {
    if (loadingId || succeededIds.has(category._id)) return

    setLoadingId(category._id)
    try {
      await categoriesApi.addTransaction(category._id, transactionId)
      setSucceededIds((prev) => new Set(prev).add(category._id))
    } catch (err: any) {
      toast.error(
        err?.message || `Failed to add transaction to "${category.name}"`
      )
    } finally {
      setLoadingId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearch("")
      setLoadingId(null)
      setSucceededIds(new Set())
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to group</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading groups...
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No groups found
              </p>
            ) : (
              filtered.map((category: Category) => {
                const isAdding = loadingId === category._id
                const isAdded = succeededIds.has(category._id)

                return (
                  <button
                    key={category._id}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!!loadingId || isAdded}
                    onClick={() => handleAdd(category)}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon && (
                        <span className="text-base">{category.icon}</span>
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 shrink-0">
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : isAdded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
