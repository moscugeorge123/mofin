import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { DashboardLayout } from "../components/dashboard-layout"
import { TransactionDetailsSheet } from "../components/transactions/transaction-details-sheet"
import { TransactionFilters } from "../components/transactions/transaction-filters"
import { TransactionPagination } from "../components/transactions/transaction-pagination"
import { TransactionTable } from "../components/transactions/transaction-table"
import { UploadTransactionDialog } from "../components/upload-transaction-dialog"
import { useBankAccounts } from "../hooks/use-bank-accounts"
import {
  useTransactionFiles,
  useTransactions,
  useTransactionTotals,
} from "../hooks/use-transactions"
import { authService } from "../services/auth.service"
import type { Transaction, TransactionsQueryParams } from "../types/transaction"

export const Route = createFileRoute("/transactions")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: TransactionsPage,
})

function TransactionsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<
    string[]
  >([])

  // Fetch bank accounts for filter
  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts()

  // Background polling for file processing status
  useTransactionFiles()

  // Filter states
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Debounced filter states (not including pagination)
  const [debouncedFilters, setDebouncedFilters] = useState({
    accountId: undefined as string | undefined,
    search: "",
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    creditDebitIndicator: undefined as "Credit" | "Debit" | undefined,
    minAmount: "",
    maxAmount: "",
  })

  // Build filter params and debounce them (excluding pagination)
  useEffect(() => {
    const timer = setTimeout(() => {
      const filters: typeof debouncedFilters = {
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
      }

      setDebouncedFilters(filters)
    }, 200)

    return () => clearTimeout(timer)
  }, [accountFilter, searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  // Build final params from debounced filters + immediate pagination
  const queryParams: TransactionsQueryParams = {
    page: currentPage,
    limit: pageSize,
  }

  if (debouncedFilters.accountId) {
    queryParams.accountId = debouncedFilters.accountId
  }

  if (debouncedFilters.search) {
    queryParams.search = debouncedFilters.search
  }

  if (debouncedFilters.startDate && debouncedFilters.endDate) {
    queryParams.startDate = debouncedFilters.startDate
    queryParams.endDate = debouncedFilters.endDate
  }

  if (debouncedFilters.creditDebitIndicator) {
    queryParams.creditDebitIndicator = debouncedFilters.creditDebitIndicator
  }

  if (debouncedFilters.minAmount) {
    queryParams.minAmount = debouncedFilters.minAmount
  }

  if (debouncedFilters.maxAmount) {
    queryParams.maxAmount = debouncedFilters.maxAmount
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [accountFilter, searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useTransactions(queryParams)

  // Get totals with the same filters but without pagination
  const totalsParams: TransactionsQueryParams = { ...queryParams }
  delete totalsParams.page
  delete totalsParams.limit

  const { data: totals } = useTransactionTotals(totalsParams)

  const transactions = response?.data || []
  const pagination = response?.pagination

  // Calculate selected transaction totals
  const selectedTotals = transactions
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

  const handleDialogClose = (open: boolean) => {
    setUploadDialogOpen(open)
  }

  const clearFilters = () => {
    setAccountFilter("all")
    setSearchQuery("")
    setDateRange(undefined)
    setTypeFilter("all")
    setMinAmount("")
    setMaxAmount("")
  }

  // Clear selections when page changes
  useEffect(() => {
    setSelectedTransactionIds([])
  }, [currentPage])

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailsSheetOpen(true)
  }

  return (
    <DashboardLayout
      currentPath="/transactions"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Transactions", isCurrentPage: true },
      ]}
    >
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                View and manage all your financial transactions
              </CardDescription>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              Upload from File
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
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
            minAmount={minAmount}
            onMinAmountChange={setMinAmount}
            maxAmount={maxAmount}
            onMaxAmountChange={setMaxAmount}
            onClearFilters={clearFilters}
          />

          {selectedTransactionIds.length === 0 ? (
            totals && (
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Credit
                  </div>
                  <div className="mt-1 text-2xl font-bold text-green-600">
                    ${totals.credit.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total Debit
                  </div>
                  <div className="mt-1 text-2xl font-bold text-red-600">
                    ${totals.debit.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground">
                    Net Balance
                  </div>
                  <div
                    className={`mt-1 text-2xl font-bold ${
                      totals.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${totals.balance.toFixed(2)}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
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
                      selectedBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${selectedBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col">
            <TransactionTable
              transactions={transactions}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              onTransactionClick={handleTransactionClick}
              selectedTransactions={selectedTransactionIds}
              onSelectionChange={setSelectedTransactionIds}
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

      <UploadTransactionDialog
        open={uploadDialogOpen}
        onOpenChange={handleDialogClose}
      />

      <TransactionDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        transaction={selectedTransaction}
      />
    </DashboardLayout>
  )
}
