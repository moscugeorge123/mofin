import { LoadingOverlay } from "@workspace/ui/components/loading-overlay"
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
import type { Transaction } from "../../types/transaction"

interface TransactionTableProps {
  transactions: Transaction[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onTransactionClick?: (transaction: Transaction) => void
}

export function TransactionTable({
  transactions,
  isLoading,
  isFetching,
  error,
  onTransactionClick,
}: TransactionTableProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        Error loading transactions: {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-auto rounded-md border">
      {isFetching && <LoadingOverlay message="Loading page..." />}

      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
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

              return (
                <TableRow
                  key={transaction._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTransactionClick?.(transaction)}
                >
                  <TableCell className="font-medium">
                    {new Date(transaction.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{transaction.store || "-"}</TableCell>
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
                    {transaction.creditDebitIndicator === "Credit" ? "+" : ""}
                    {Math.abs(transaction.amount.sum).toFixed(2)}{" "}
                    {transaction.amount.currency}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
