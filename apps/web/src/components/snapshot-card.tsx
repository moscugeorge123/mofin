import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Check,
  Pencil,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  useAddSnapshotCollaborator,
  useRemoveSnapshotCollaborator,
  useSnapshotCollaborators,
  useSnapshotTotals,
  useUpdateSnapshot,
} from "../hooks/use-snapshots"
import { formatNumber } from "../lib/utils"
import type { Snapshot } from "../types/snapshot"

interface SnapshotCardProps {
  snapshot: Snapshot
  isOwner: boolean
  onClick: (snapshot: Snapshot) => void
  onDelete: (e: React.MouseEvent, snapshot: Snapshot) => void
}

export function SnapshotCard({
  snapshot,
  isOwner,
  onClick,
  onDelete,
}: SnapshotCardProps) {
  const { data: totals, isLoading: totalsLoading } = useSnapshotTotals(
    snapshot._id,
    {}
  )

  // Inline name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(snapshot.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateSnapshot()

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNameValue(snapshot.name)
    setEditingName(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingName(false)
    setNameValue(snapshot.name)
  }

  const saveName = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === snapshot.name) {
      cancelEditing()
      return
    }
    try {
      await updateMutation.mutateAsync({
        id: snapshot._id,
        data: { name: trimmed },
      })
      toast.success("Snapshot renamed")
      setEditingName(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to rename snapshot")
    }
  }

  // Collaborators dialog
  const [shareOpen, setShareOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const { data: collaborators = [] } = useSnapshotCollaborators(snapshot._id)
  const addMutation = useAddSnapshotCollaborator(snapshot._id)
  const removeMutation = useRemoveSnapshotCollaborator(snapshot._id)

  const handleAddCollaborator = async () => {
    if (!newEmail.trim()) return
    try {
      await addMutation.mutateAsync(newEmail.trim())
      toast.success("Collaborator added")
      setNewEmail("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to add collaborator")
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await removeMutation.mutateAsync(collaboratorId)
      toast.success("Collaborator removed")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove collaborator")
    }
  }

  return (
    <>
      {/* Collaborators dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators — {snapshot.name}
            </DialogTitle>
            <DialogDescription>
              Manage who can view this snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No collaborators yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {collaborators.map((c) => (
                  <div
                    key={c._id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveCollaborator(c._id)}
                        disabled={removeMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isOwner && (
              <div className="flex gap-2 border-t pt-3">
                <Input
                  placeholder="Email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCollaborator()
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddCollaborator}
                  disabled={!newEmail.trim() || addMutation.isPending}
                  size="icon"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card
        className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md"
        onClick={() => !editingName && onClick(snapshot)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="shrink-0 text-3xl">
                {snapshot.groupIcon || "📷"}
              </div>
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      ref={inputRef}
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName()
                        if (e.key === "Escape") cancelEditing()
                      }}
                      className="h-7 text-sm font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={saveName}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={cancelEditing}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-1">
                    <CardTitle className="truncate text-lg">
                      {snapshot.name}
                    </CardTitle>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={startEditing}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>From:</span>
                  <span className="truncate font-medium">
                    {snapshot.groupName}
                  </span>
                </div>
              </div>
            </div>
            {!isOwner && (
              <Badge
                variant="secondary"
                className="flex shrink-0 items-center gap-1 text-xs"
              >
                <Share2 className="h-3 w-3" />
                Shared
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3">
          {/* Transaction Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Transactions</span>
            <Badge variant="secondary">{snapshot.transactionIds.length}</Badge>
          </div>

          {/* Currency breakdown */}
          {totalsLoading ? (
            <div className="h-6 animate-pulse rounded bg-muted" />
          ) : totals &&
            totals.byCurrency &&
            Object.keys(totals.byCurrency).length > 0 ? (
            <div className="flex flex-col gap-1">
              {Object.entries(totals.byCurrency).map(([currency, amounts]) => {
                const balance = amounts.credit - amounts.debit
                return (
                  <div
                    key={currency}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-muted-foreground">
                      {currency}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-600">
                        ↑{formatNumber(amounts.credit)}
                      </span>
                      <span className="text-red-600">
                        ↓{formatNumber(amounts.debit)}
                      </span>
                      <span className="text-muted-foreground">=</span>
                      <span
                        className={`font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatNumber(balance)}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t pt-1 text-xs">
                <span className="font-semibold text-muted-foreground">
                  Total RON
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600">
                    ↑{formatNumber(totals.credit)}
                  </span>
                  <span className="text-red-600">
                    ↓{formatNumber(totals.debit)}
                  </span>
                  <span className="text-muted-foreground">=</span>
                  <span
                    className={`font-semibold ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatNumber(totals.balance)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Date */}
          <div className="flex items-center justify-end text-xs text-muted-foreground">
            <span>{new Date(snapshot.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Bottom actions */}
          <div
            className="mt-auto flex gap-2 border-t pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex flex-1 items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation()
                setShareOpen(true)
              }}
            >
              <Users className="h-4 w-4" />
              Share
              {collaborators.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {collaborators.length}
                </Badge>
              )}
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-destructive hover:text-destructive"
                onClick={(e) => onDelete(e, snapshot)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
