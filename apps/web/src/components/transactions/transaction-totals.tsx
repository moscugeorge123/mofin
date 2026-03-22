import { Skeleton } from "@workspace/ui/components/skeleton"

interface TransactionTotals {
  credit: number
  debit: number
  balance: number
}

interface TransactionTotalsProps {
  isLoading: boolean
  totals?: TransactionTotals
  selectedCount?: number
  selectedTotals?: {
    credit: number
    debit: number
  }
  className?: string
}

export function TransactionTotalsDisplay({
  isLoading,
  totals,
  selectedCount = 0,
  selectedTotals,
  className = "",
}: TransactionTotalsProps) {
  const selectedBalance = selectedTotals
    ? selectedTotals.credit - selectedTotals.debit
    : 0

  // Show selected transactions bar when items are selected
  if (selectedCount > 0 && selectedTotals) {
    return (
      <div
        className={`mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 ${className}`}
      >
        <span className="text-sm font-medium text-muted-foreground">
          {selectedCount} transaction{selectedCount !== 1 ? "s" : ""} selected
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
    )
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={`mb-4 grid grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-8 w-32" />
          </div>
        ))}
      </div>
    )
  }

  // Show totals cards
  if (!totals) {
    return null
  }

  return (
    <div className={`mb-4 grid grid-cols-3 gap-4 ${className}`}>
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
}
