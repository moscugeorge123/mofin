import { createFileRoute, redirect } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Search, X } from "lucide-react"
import React, { useEffect, useState } from "react"
import type { DateRange } from "react-day-picker"
import { DashboardLayout } from "../components/dashboard-layout"
import { UploadTransactionDialog } from "../components/upload-transaction-dialog"
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Debounced filter params state
  const [debouncedParams, setDebouncedParams] =
    useState<TransactionsQueryParams>({})

  // Build filter params and debounce them
  useEffect(() => {
    const timer = setTimeout(() => {
      const params: TransactionsQueryParams = {
        page: currentPage,
        limit: pageSize,
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      // Only add date range if both from and to are present
      if (dateRange?.from && dateRange?.to) {
        params.startDate = dateRange.from.toISOString()
        params.endDate = dateRange.to.toISOString()
      }

      if (typeFilter !== "all") {
        params.creditDebitIndicator =
          typeFilter === "credit" ? "Credit" : "Debit"
      }

      if (minAmount) {
        params.minAmount = minAmount
      }

      if (maxAmount) {
        params.maxAmount = maxAmount
      }

      setDebouncedParams(params)
    }, 200)

    return () => clearTimeout(timer)
  }, [
    searchQuery,
    dateRange,
    typeFilter,
    minAmount,
    maxAmount,
    currentPage,
    pageSize,
  ])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateRange, typeFilter, minAmount, maxAmount])

  const { data: response, isLoading, error } = useTransactions(debouncedParams)

  const transactions = response?.data || []
  const pagination = response?.pagination

  const handleDialogClose = (open: boolean) => {
    setUploadDialogOpen(open)
  }

  const clearFilters = () => {
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
          {/* Filters Section */}
          <div className="mb-6 shrink-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery ||
              dateRange ||
              typeFilter !== "all" ||
              minAmount ||
              maxAmount) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex min-h-0 flex-1 flex-col">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading transactions: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  Loading transactions...
                </div>
              </div>
            )}

            {!isLoading && !error && transactions && (
              <>
                {transactions.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => {
                            const categoryName =
                              typeof transaction.category === "string"
                                ? transaction.category
                                : transaction.category?.name
                            // const tagNames =
                            //   transaction.tags?.map((tag) =>
                            //     typeof tag === "string" ? tag : (tag as Tag).name
                            //   ) || []

                            return (
                              <TableRow key={transaction._id}>
                                <TableCell className="font-medium">
                                  {new Date(
                                    transaction.date
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </TableCell>
                                <TableCell>
                                  {transaction.store || "-"}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {transaction.notes || "-"}
                                </TableCell>
                                <TableCell>{categoryName || "-"}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      transaction.status === "Booked"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      transaction.creditDebitIndicator ===
                                      "Credit"
                                        ? "default"
                                        : "outline"
                                    }
                                  >
                                    {transaction.creditDebitIndicator}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`text-right font-medium ${
                                    transaction.creditDebitIndicator ===
                                    "Credit"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.creditDebitIndicator === "Credit"
                                    ? "+"
                                    : "-"}
                                  {Math.abs(transaction.amount.sum).toFixed(2)}{" "}
                                  {transaction.amount.currency}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {pagination && (
                      <div className="mt-4 flex shrink-0 items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {(pagination.page - 1) * pagination.limit + 1}{" "}
                          to{" "}
                          {Math.min(
                            pagination.page * pagination.limit,
                            pagination.total
                          )}{" "}
                          of {pagination.total} transactions
                        </div>
                        {pagination.totalPages > 1 && (
                          <div className="flex justify-end">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      setCurrentPage((prev) =>
                                        Math.max(1, prev - 1)
                                      )
                                    }
                                    className={
                                      currentPage === 1
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                                {Array.from(
                                  { length: pagination.totalPages },
                                  (_, i) => i + 1
                                )
                                  .filter((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    return (
                                      page === 1 ||
                                      page === pagination.totalPages ||
                                      Math.abs(page - currentPage) <= 1
                                    )
                                  })
                                  .map((page, index, array) => {
                                    // Add ellipsis
                                    const prevPage = array[index - 1]
                                    const showEllipsis =
                                      prevPage && page - prevPage > 1

                                    return (
                                      <React.Fragment key={page}>
                                        {showEllipsis && (
                                          <PaginationItem>
                                            <span className="px-4">...</span>
                                          </PaginationItem>
                                        )}
                                        <PaginationItem>
                                          <PaginationLink
                                            onClick={() => setCurrentPage(page)}
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      </React.Fragment>
                                    )
                                  })}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() =>
                                      setCurrentPage((prev) =>
                                        Math.min(
                                          pagination.totalPages,
                                          prev + 1
                                        )
                                      )
                                    }
                                    className={
                                      currentPage === pagination.totalPages
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
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
