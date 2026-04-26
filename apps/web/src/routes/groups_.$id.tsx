import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArrowLeft } from "lucide-react"
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
import { useCategory, useGroupTotals } from "../hooks/use-categories"
import { authService } from "../services/auth.service"
import { categoriesApi } from "../services/categories.service"
import type { Transaction } from "../types/transaction"

export const Route = createFileRoute("/groups_/$id")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: GroupTransactionsPage,
})

function GroupTransactionsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)

  // Fetch category details
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategory(id)

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [accountFilter, searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["category-transactions-by-rules", id, queryParams],
    queryFn: () => categoriesApi.getTransactionsByRules(id, queryParams),
    enabled: !!id && !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const transactions = response?.data || []
  const pagination = response?.pagination

  // Fetch totals (without pagination)
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
  const { data: totals, isLoading: totalsLoading } = useGroupTotals(
    id,
    totalsParams
  )

  const clearFilters = () => {
    setAccountFilter("all")
    setSearchQuery("")
    setDateRange(undefined)
    setTypeFilter("all")
    setMinAmount("")
    setMaxAmount("")
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setDetailsSheetOpen(true)
  }

  const handleRemoveFromGroup = async (transactionId: string) => {
    try {
      await categoriesApi.removeTransaction(id, transactionId)
      queryClient.invalidateQueries({
        queryKey: ["category-transactions-by-rules", id],
      })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Transaction removed from group")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove transaction from group")
    }
  }

  const handleExcludeFromGroup = async (transactionId: string) => {
    try {
      await categoriesApi.removeTransaction(id, transactionId)
      queryClient.invalidateQueries({
        queryKey: ["category-transactions-by-rules", id],
      })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Transaction excluded from group")
    } catch (err: any) {
      toast.error(err?.message || "Failed to exclude transaction from group")
    }
  }

  const handleBackClick = () => {
    navigate({ to: "/groups" })
  }

  if (categoryError) {
    return (
      <DashboardLayout
        currentPath="/groups"
        breadcrumbItems={[
          { label: "Dashboard", href: "/" },
          { label: "Groups", href: "/groups" },
          { label: "Error", isCurrentPage: true },
        ]}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Error loading group: {categoryError.message}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  if (categoryLoading) {
    return (
      <DashboardLayout
        currentPath="/groups"
        breadcrumbItems={[
          { label: "Dashboard", href: "/" },
          { label: "Groups", href: "/groups" },
          { label: "Loading...", isCurrentPage: true },
        ]}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading group...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      currentPath="/groups"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Groups", href: "/groups" },
        { label: category?.name || "Group", isCurrentPage: true },
      ]}
    >
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="shrink-0 text-3xl">{category?.icon || "💰"}</div>
              <div className="min-w-0 flex-1">
                <CardTitle>{category?.name}</CardTitle>
                {category?.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <TransactionTotalsDisplay
                isLoading={totalsLoading}
                totals={totals}
                className="mb-0"
              />
            </div>
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
              onTransactionClick={handleTransactionClick}
              onRemoveFromGroup={handleRemoveFromGroup}
              onExcludeFromGroup={handleExcludeFromGroup}
              manualTransactionIds={category?.manualTransactionIds}
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
