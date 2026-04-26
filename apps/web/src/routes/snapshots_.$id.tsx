import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
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
import { ArrowLeft, Share2, UserMinus, UserPlus, Users } from "lucide-react"
import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { DashboardLayout } from "../components/dashboard-layout"
import { TransactionDetailsSheet } from "../components/transactions/transaction-details-sheet"
import { TransactionFilters } from "../components/transactions/transaction-filters"
import { TransactionPagination } from "../components/transactions/transaction-pagination"
import { TransactionTable } from "../components/transactions/transaction-table"
import { TransactionTotalsDisplay } from "../components/transactions/transaction-totals"
import { useBankAccounts } from "../hooks/use-bank-accounts"
import {
  useAddSnapshotCollaborator,
  useRemoveSnapshotCollaborator,
  useSnapshot,
  useSnapshotCollaborators,
  useSnapshotTotals,
} from "../hooks/use-snapshots"
import { useUser } from "../hooks/use-user"
import { authService } from "../services/auth.service"
import { snapshotsApi } from "../services/snapshots.service"
import type { Transaction } from "../types/transaction"

export const Route = createFileRoute("/snapshots_/$id")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: SnapshotDetailPage,
})

function SnapshotDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useUser()

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false)
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("")

  // Fetch snapshot
  const {
    data: snapshot,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useSnapshot(id)

  const isOwner = snapshot?.ownerId === user?.id

  // Collaborators
  const { data: collaborators = [] } = useSnapshotCollaborators(id)
  const addCollaboratorMutation = useAddSnapshotCollaborator(id)
  const removeCollaboratorMutation = useRemoveSnapshotCollaborator(id)

  // Filters
  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts()
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currencyFilter, setCurrencyFilter] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const [debouncedFilters, setDebouncedFilters] = useState({
    accountId: undefined as string | undefined,
    search: "",
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    creditDebitIndicator: undefined as "Credit" | "Debit" | undefined,
    minAmount: "",
    maxAmount: "",
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        accountId: accountFilter !== "all" ? accountFilter : undefined,
        search: searchQuery,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        creditDebitIndicator:
          typeFilter !== "all"
            ? typeFilter === "credit"
              ? "Credit"
              : "Debit"
            : undefined,
        minAmount,
        maxAmount,
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [accountFilter, searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  useEffect(() => {
    setCurrentPage(1)
  }, [accountFilter, searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  const queryParams = {
    page: currentPage,
    limit: pageSize,
    ...(debouncedFilters.accountId && {
      accountId: debouncedFilters.accountId,
    }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
    ...(debouncedFilters.startDate &&
      debouncedFilters.endDate && {
        startDate: debouncedFilters.startDate,
        endDate: debouncedFilters.endDate,
      }),
    ...(debouncedFilters.creditDebitIndicator && {
      creditDebitIndicator: debouncedFilters.creditDebitIndicator,
    }),
    ...(debouncedFilters.minAmount && {
      minAmount: debouncedFilters.minAmount,
    }),
    ...(debouncedFilters.maxAmount && {
      maxAmount: debouncedFilters.maxAmount,
    }),
  }

  const {
    data: response,
    isLoading,
    isFetching,
    error: transactionsError,
  } = useQuery({
    queryKey: ["snapshot-transactions", id, queryParams],
    queryFn: () => snapshotsApi.getTransactions(id, queryParams),
    enabled: !!id && !!snapshot,
    staleTime: 5 * 60 * 1000,
  })

  const transactions = response?.data || []
  const pagination = response?.pagination

  const totalsParams = {
    ...(debouncedFilters.accountId && {
      accountId: debouncedFilters.accountId,
    }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
    ...(debouncedFilters.startDate &&
      debouncedFilters.endDate && {
        startDate: debouncedFilters.startDate,
        endDate: debouncedFilters.endDate,
      }),
    ...(debouncedFilters.creditDebitIndicator && {
      creditDebitIndicator: debouncedFilters.creditDebitIndicator,
    }),
    ...(debouncedFilters.minAmount && {
      minAmount: debouncedFilters.minAmount,
    }),
    ...(debouncedFilters.maxAmount && {
      maxAmount: debouncedFilters.maxAmount,
    }),
  }
  const { data: totals, isLoading: totalsLoading } = useSnapshotTotals(
    id,
    totalsParams
  )

  const clearFilters = () => {
    setAccountFilter("all")
    setSearchQuery("")
    setDateRange(undefined)
    setTypeFilter("all")
    setCurrencyFilter("all")
    setMinAmount("")
    setMaxAmount("")
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailsSheetOpen(true)
  }

  const handleRemoveFromSnapshot = async (transactionId: string) => {
    try {
      await snapshotsApi.removeTransaction(id, transactionId)
      queryClient.invalidateQueries({
        queryKey: ["snapshot-transactions", id],
      })
      queryClient.invalidateQueries({ queryKey: ["snapshots", "detail", id] })
      toast.success("Transaction removed from snapshot")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove transaction")
    }
  }

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) return
    try {
      await addCollaboratorMutation.mutateAsync(newCollaboratorEmail.trim())
      toast.success("Collaborator added")
      setNewCollaboratorEmail("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to add collaborator")
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await removeCollaboratorMutation.mutateAsync(collaboratorId)
      toast.success("Collaborator removed")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove collaborator")
    }
  }

  if (snapshotError) {
    return (
      <DashboardLayout
        currentPath="/snapshots"
        breadcrumbItems={[
          { label: "Dashboard", href: "/" },
          { label: "Snapshots", href: "/snapshots" },
          { label: "Error", isCurrentPage: true },
        ]}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Error loading snapshot: {(snapshotError as Error).message}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  if (snapshotLoading) {
    return (
      <DashboardLayout
        currentPath="/snapshots"
        breadcrumbItems={[
          { label: "Dashboard", href: "/" },
          { label: "Snapshots", href: "/snapshots" },
          { label: "Loading...", isCurrentPage: true },
        ]}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">
            Loading snapshot...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      currentPath="/snapshots"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Snapshots", href: "/snapshots" },
        { label: snapshot?.name || "Snapshot", isCurrentPage: true },
      ]}
    >
      {/* Collaborators dialog */}
      <Dialog open={collaboratorsOpen} onOpenChange={setCollaboratorsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators
            </DialogTitle>
            <DialogDescription>
              Manage who can view this snapshot.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Current collaborators */}
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
                        disabled={removeCollaboratorMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add collaborator */}
            {isOwner && (
              <div className="flex gap-2 border-t pt-3">
                <Input
                  placeholder="Email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCollaborator()
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddCollaborator}
                  disabled={
                    !newCollaboratorEmail.trim() ||
                    addCollaboratorMutation.isPending
                  }
                  size="icon"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCollaboratorsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/snapshots" })}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* Source group reference */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{snapshot?.groupIcon || "💰"}</span>
                <span>From group: {snapshot?.groupName}</span>
              </div>
              <div className="flex items-center gap-3">
                <CardTitle>{snapshot?.name}</CardTitle>
                {snapshot && snapshot.ownerId !== user?.id && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-3 w-3" />
                    Shared with you
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => setCollaboratorsOpen(true)}
                >
                  <Users className="h-4 w-4" />
                  {collaborators.length > 0 ? (
                    <span>{collaborators.length}</span>
                  ) : (
                    <span>Share</span>
                  )}
                </Button>
              </div>
              {snapshot?.description && (
                <CardDescription>{snapshot.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <TransactionTotalsDisplay
            isLoading={totalsLoading}
            totals={totals}
            className="mb-4 w-full"
            flat
          />
          <TransactionFilters
            accountFilter={accountFilter}
            onAccountFilterChange={setAccountFilter}
            accounts={accounts}
            accountsLoading={accountsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            currencyFilter={currencyFilter}
            onCurrencyFilterChange={setCurrencyFilter}
            minAmount={minAmount}
            onMinAmountChange={setMinAmount}
            maxAmount={maxAmount}
            onMaxAmountChange={setMaxAmount}
            onClearFilters={clearFilters}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            <TransactionTable
              transactions={transactions}
              isLoading={isLoading}
              isFetching={isFetching}
              error={transactionsError}
              onTransactionClick={handleTransactionClick}
              onRemoveFromGroup={handleRemoveFromSnapshot}
              removeFromGroupLabel="Remove from snapshot"
              manualTransactionIds={snapshot?.transactionIds}
            />

            {pagination && pagination.totalPages > 1 && (
              <TransactionPagination
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        transaction={selectedTransaction}
      />
    </DashboardLayout>
  )
}
