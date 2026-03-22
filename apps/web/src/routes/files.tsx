import { createFileRoute, redirect } from "@tanstack/react-router"
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
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  CheckCircle2,
  FileIcon,
  Loader2,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DashboardLayout } from "../components/dashboard-layout"
import { TransactionDetailsSheet } from "../components/transactions/transaction-details-sheet"
import { TransactionTable } from "../components/transactions/transaction-table"
import {
  useDeleteFile,
  useFileStatus,
  useFileTotals,
  useRenameFile,
  useTransactionFiles,
} from "../hooks/use-transactions"
import { authService } from "../services/auth.service"
import type { Transaction, TransactionFile } from "../types/transaction"

export const Route = createFileRoute("/files")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: FilesPage,
})

function FilesPage() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<
    string[]
  >([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<TransactionFile | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<TransactionFile | null>(null)
  const [newFileName, setNewFileName] = useState("")

  const { data: filesData, isLoading: filesLoading } = useTransactionFiles()
  const { data: fileDetails, isLoading: fileDetailsLoading } = useFileStatus(
    selectedFileId,
    !!selectedFileId
  )
  const { data: fileTotals } = useFileTotals(selectedFileId)
  const deleteFileMutation = useDeleteFile()
  const renameFileMutation = useRenameFile()

  const files = filesData?.files || []
  const selectedFile = files.find((f) => f.fileId === selectedFileId)
  const fileTransactions = fileDetails?.transactions || []

  // Calculate selected transaction totals
  const selectedTotals = fileTransactions
    .filter((t) => selectedTransactionIds.includes(t._id))
    .reduce(
      (acc, t) => {
        if (t.creditDebitIndicator === "Credit") {
          acc.credit += t.amount.sum
        } else {
          acc.debit += t.amount.sum
        }
        return acc
      },
      { credit: 0, debit: 0 }
    )
  const selectedBalance = selectedTotals.credit - selectedTotals.debit

  // Clear selections when file changes
  useEffect(() => {
    setSelectedTransactionIds([])
  }, [selectedFileId])

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailsSheetOpen(true)
  }

  const handleRenameClick = (file: TransactionFile, e: React.MouseEvent) => {
    e.stopPropagation()
    setFileToRename(file)
    setNewFileName(file.originalName)
    setRenameDialogOpen(true)
  }

  const handleDeleteClick = (file: TransactionFile, e: React.MouseEvent) => {
    e.stopPropagation()
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const handleConfirmRename = async () => {
    if (!fileToRename || !newFileName.trim()) return

    try {
      await renameFileMutation.mutateAsync({
        fileId: fileToRename.fileId,
        originalName: newFileName.trim(),
      })
      toast.success("File renamed successfully")
      setRenameDialogOpen(false)
      setFileToRename(null)
      setNewFileName("")
    } catch (err: any) {
      toast.error(err.message || "Failed to rename file")
    }
  }

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return

    try {
      const result = await deleteFileMutation.mutateAsync(fileToDelete.fileId)
      toast.success(
        `File deleted successfully. ${result.transactionCount} transactions removed.`
      )
      setDeleteDialogOpen(false)
      setFileToDelete(null)
      // Clear selection if the deleted file was selected
      if (selectedFileId === fileToDelete.fileId) {
        setSelectedFileId(null)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete file")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "processing":
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      default:
        return <FileIcon className="h-4 w-4" />
    }
  }

  const getAccountName = (file: TransactionFile) => {
    if (typeof file.accountId === "object") {
      return file.accountId.name
    }
    return "Unknown Account"
  }

  return (
    <DashboardLayout
      currentPath="/files"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Files", isCurrentPage: true },
      ]}
    >
      <TransactionDetailsSheet
        transaction={selectedTransaction}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
      />

      <div className="flex h-full gap-4">
        {/* Left Side - Files List */}
        <Card className="w-80 shrink-0">
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Click a file to view its transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[calc(100vh-16rem)] overflow-auto">
              {filesLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No files uploaded yet
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {files.map((file) => (
                    <div
                      key={file.fileId}
                      className={`group relative w-full rounded-md transition-colors hover:bg-muted ${
                        selectedFileId === file.fileId ? "bg-muted" : ""
                      }`}
                    >
                      <button
                        onClick={() => setSelectedFileId(file.fileId)}
                        className="w-full p-3 text-left"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {getStatusIcon(file.status)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate text-sm font-medium">
                              {file.originalName}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {file.transactionCount} transactions
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {getAccountName(file)}
                            </div>
                            {file.errorMessage && (
                              <div className="mt-1 text-xs text-red-600">
                                {file.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handleRenameClick(file, e)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={(e) => handleDeleteClick(file, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Transactions */}
        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>
              {selectedFile ? selectedFile.originalName : "Transactions"}
            </CardTitle>
            <CardDescription>
              {selectedFile && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Bank Account: </span>
                  <Badge variant="outline">
                    {getAccountName(selectedFile)}
                  </Badge>
                </div>
              )}
              {!selectedFile && "Select a file to view its transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {!selectedFileId ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                Select a file from the list to view transactions
              </div>
            ) : fileDetailsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {selectedTransactionIds.length === 0 ? (
                  fileTotals && (
                    <div className="mb-4 grid grid-cols-3 gap-4 px-6">
                      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground">
                          Total Credit
                        </div>
                        <div className="mt-1 text-2xl font-bold text-green-600">
                          ${fileTotals.credit.toFixed(2)}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground">
                          Total Debit
                        </div>
                        <div className="mt-1 text-2xl font-bold text-red-600">
                          ${fileTotals.debit.toFixed(2)}
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <div className="text-sm font-medium text-muted-foreground">
                          Net Balance
                        </div>
                        <div
                          className={`mt-1 text-2xl font-bold ${
                            fileTotals.balance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${fileTotals.balance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="mx-6 mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedTransactionIds.length} transaction
                      {selectedTransactionIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Credit:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          ${selectedTotals.credit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Debit:
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          ${selectedTotals.debit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Balance:
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            selectedBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${selectedBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <TransactionTable
                  transactions={fileTransactions}
                  isLoading={false}
                  isFetching={false}
                  error={null}
                  onTransactionClick={handleTransactionClick}
                  selectedTransactions={selectedTransactionIds}
                  onSelectionChange={setSelectedTransactionIds}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>Enter a new name for the file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter file name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFileName.trim()) {
                    handleConfirmRename()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={renameFileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRename}
              disabled={!newFileName.trim() || renameFileMutation.isPending}
            >
              {renameFileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              file <strong>{fileToDelete?.originalName}</strong> and remove all{" "}
              <strong>
                {fileToDelete?.transactionCount} associated transactions
              </strong>{" "}
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFileMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteFileMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteFileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete File & Transactions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
