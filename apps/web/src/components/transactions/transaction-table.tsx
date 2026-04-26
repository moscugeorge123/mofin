import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { LoadingOverlay } from "@workspace/ui/components/loading-overlay"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useState } from "react"
import { useCurrencyRates } from "../../hooks/use-currency-rates"
import { formatNumber } from "../../lib/utils"
import type { Transaction } from "../../types/transaction"
import { AddToGroupDialog } from "./add-to-group-dialog"

interface TransactionTableProps {
  transactions: Transaction[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onTransactionClick?: (transaction: Transaction) => void
  selectedTransactions?: string[]
  onSelectionChange?: (transactionIds: string[]) => void
  onRemoveFromGroup?: (transactionId: string) => void
  manualTransactionIds?: string[]
}

export function TransactionTable({
  transactions,
  isLoading,
  isFetching,
  error,
  onTransactionClick,
  selectedTransactions = [],
  onSelectionChange,
  onRemoveFromGroup,
  manualTransactionIds = [],
}: TransactionTableProps) {
  const manualSet = new Set(manualTransactionIds)
  const { data: currencyRates } = useCurrencyRates()
  const [addToGroupTransactionId, setAddToGroupTransactionId] = useState<
    string | null
  >(null)

  const toRON = (amount: number, currency: string): number | null => {
    if (!currencyRates) return null
    if (currency === "RON") return amount
    const key = `${currency}_RON` as keyof typeof currencyRates
    const rate = currencyRates[key]
    if (typeof rate !== "number") return null
    return amount * rate
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(transactions.map((t) => t._id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (transactionId: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedTransactions, transactionId])
    } else {
      onSelectionChange(
        selectedTransactions.filter((id) => id !== transactionId)
      )
    }
  }

  const isAllSelected =
    transactions.length > 0 &&
    transactions.every((t) => selectedTransactions.includes(t._id))
  const isSomeSelected = selectedTransactions.length > 0 && !isAllSelected
  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        Error loading transactions: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative flex-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              {onSelectionChange && <TableHead className="w-12" />}
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TableRow key={i}>
                {onSelectionChange && (
                  <TableCell className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-20" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-auto rounded-md border">
      {isFetching && <LoadingOverlay message="Loading page..." />}

      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    isAllSelected || (isSomeSelected ? "indeterminate" : false)
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all transactions"
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onSelectionChange ? 7 : 6}
                className="text-center text-muted-foreground"
              >
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const categoryName =
                typeof transaction.category === "string"
                  ? transaction.category
                  : transaction.category?.name

              const isSelected = selectedTransactions.includes(transaction._id)

              return (
                <TableRow
                  key={transaction._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  {onSelectionChange && (
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="w-12"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectOne(transaction._id, checked as boolean)
                        }
                        aria-label={`Select transaction ${transaction._id}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {new Date(transaction.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.store || "-"}
                      {manualSet.has(transaction._id) && (
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 text-[10px]"
                        >
                          Manual
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.notes ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {transaction.notes}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-md">
                            <p className="whitespace-pre-wrap">
                              {transaction.notes}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{categoryName || "-"}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.creditDebitIndicator === "Credit"
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    {(() => {
                      const { sum, currency } = transaction.amount
                      const sign =
                        transaction.creditDebitIndicator === "Credit" ? "+" : ""
                      const ronValue = toRON(Math.abs(sum), currency)
                      const showOriginal =
                        currency !== "RON" && ronValue !== null
                      return (
                        <div className="flex flex-col items-end leading-tight">
                          <span>
                            {sign}
                            {formatNumber(ronValue ?? Math.abs(sum))} RON
                          </span>
                          {showOriginal && (
                            <span className="text-xs font-normal text-muted-foreground">
                              {sign}
                              {formatNumber(Math.abs(sum))} {currency}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={"h-7 w-7 p-0"}
                          hidden={
                            !!onRemoveFromGroup &&
                            !manualSet.has(transaction._id)
                          }
                        >
                          <span className="sr-only">Open actions</span>
                          &#8942;
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {!onRemoveFromGroup && (
                          <DropdownMenuItem
                            onSelect={() =>
                              setAddToGroupTransactionId(transaction._id)
                            }
                          >
                            Add to group
                          </DropdownMenuItem>
                        )}
                        {onRemoveFromGroup &&
                          manualSet.has(transaction._id) && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() =>
                                onRemoveFromGroup(transaction._id)
                              }
                            >
                              Remove from group
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {addToGroupTransactionId && (
        <AddToGroupDialog
          open={!!addToGroupTransactionId}
          onOpenChange={(open) => {
            if (!open) setAddToGroupTransactionId(null)
          }}
          transactionId={addToGroupTransactionId}
        />
      )}
    </div>
  )
}
