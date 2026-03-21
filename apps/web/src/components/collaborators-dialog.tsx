import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  useAddCollaborator,
  useCollaborators,
  useRemoveCollaborator,
} from "../hooks/use-bank-accounts"

interface CollaboratorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  accountName?: string
}

export function CollaboratorsDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
}: CollaboratorsDialogProps) {
  const [newEmail, setNewEmail] = useState("")

  const {
    data: collaborators = [],
    isLoading,
    error,
  } = useCollaborators(accountId)
  const addCollaboratorMutation = useAddCollaborator()
  const removeCollaboratorMutation = useRemoveCollaborator()

  const handleRemoveCollaborator = (userId: string) => {
    removeCollaboratorMutation.mutate({ accountId, userId })
  }

  const handleAddCollaborator = () => {
    const email = newEmail.trim()

    if (!email) {
      return
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    toast.info("The user will be added if they exist in the system")
    addCollaboratorMutation.mutate(
      { accountId, email },
      {
        onSuccess: () => {
          setNewEmail("")
        },
      }
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddCollaborator()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            {accountName
              ? `Manage collaborators for ${accountName}`
              : "Manage collaborators for this account"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Collaborators List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Collaborators</Label>
            {isLoading ? (
              <div className="flex items-center justify-center rounded-md border border-dashed p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-destructive">
                Failed to load collaborators
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No collaborators yet
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between rounded-md border bg-card p-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{collaborator.email}</span>
                      {(collaborator.firstName || collaborator.lastName) && (
                        <span className="text-xs text-muted-foreground">
                          {[collaborator.firstName, collaborator.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      disabled={removeCollaboratorMutation.isPending}
                    >
                      {removeCollaboratorMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Collaborator Form */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Add Collaborator
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={addCollaboratorMutation.isPending}
              />
              <Button
                onClick={handleAddCollaborator}
                disabled={addCollaboratorMutation.isPending || !newEmail.trim()}
              >
                {addCollaboratorMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
