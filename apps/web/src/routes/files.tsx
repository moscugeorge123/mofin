import { createFileRoute, redirect } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { CheckCircle2, FileIcon, Loader2, XCircle } from "lucide-react"
import { useState } from "react"
import { DashboardLayout } from "../components/dashboard-layout"
import { TransactionDetailsSheet } from "../components/transactions/transaction-details-sheet"
import { TransactionTable } from "../components/transactions/transaction-table"
import { useFileStatus, useTransactionFiles } from "../hooks/use-transactions"
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

  const { data: filesData, isLoading: filesLoading } = useTransactionFiles()
  const { data: fileDetails, isLoading: fileDetailsLoading } = useFileStatus(
    selectedFileId,
    !!selectedFileId
  )

  const files = filesData?.files || []
  const selectedFile = files.find((f) => f.fileId === selectedFileId)

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailsSheetOpen(true)
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
                    <button
                      key={file.fileId}
                      onClick={() => setSelectedFileId(file.fileId)}
                      className={`w-full rounded-md p-3 text-left transition-colors hover:bg-muted ${
                        selectedFileId === file.fileId ? "bg-muted" : ""
                      }`}
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
              <TransactionTable
                transactions={fileDetails?.transactions || []}
                isLoading={false}
                isFetching={false}
                error={null}
                onTransactionClick={handleTransactionClick}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
