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
import { TransactionFilters } from "../components/transactions/transaction-filters"
import { TransactionPagination } from "../components/transactions/transaction-pagination"
import { TransactionTable } from "../components/transactions/transaction-table"
import { UploadTransactionDialog } from "../components/upload-transaction-dialog"
import { useBankAccounts } from "../hooks/use-bank-accounts"
import { useTransactions } from "../hooks/use-transactions"
import { authService } from "../services/auth.service"
import type { TransactionsQueryParams } from "../types/transaction"

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

  // Fetch bank accounts for filter
  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts()

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

  const transactions = response?.data || []
  const pagination = response?.pagination

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

          <div className="flex min-h-0 flex-1 flex-col">
            <TransactionTable
              transactions={transactions}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
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
    </DashboardLayout>
  )
}
