import { Skeleton } from "@workspace/ui/components/skeleton"
import { formatNumber } from "../../lib/utils"

interface TransactionTotals {
  credit: number
  debit: number
  balance: number
  byCurrency?: Record<string, { credit: number; debit: number }>
}

interface TransactionTotalsProps {
  isLoading: boolean
  totals?: TransactionTotals
  selectedCount?: number
  selectedTotals?: {
    credit: number
    debit: number
    byCurrency?: Record<string, { credit: number; debit: number }>
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
        className={`mb-4 rounded-lg border bg-muted/50 px-4 py-3 ${className}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedCount} transaction{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Credit:
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatNumber(selectedTotals.credit)} RON
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Debit:
              </span>
              <span className="text-lg font-bold text-red-600">
                {formatNumber(selectedTotals.debit)} RON
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
                {formatNumber(selectedBalance)} RON
              </span>
            </div>
          </div>
        </div>
        {selectedTotals.byCurrency &&
          Object.keys(selectedTotals.byCurrency).length > 0 && (
            <div className="flex flex-wrap gap-4 border-t pt-2 text-xs text-muted-foreground">
              {Object.entries(selectedTotals.byCurrency).map(
                ([currency, amounts]) => {
                  const balance = amounts.credit - amounts.debit
                  return (
                    <div key={currency} className="flex items-center gap-2">
                      <span className="font-medium">{currency}:</span>
                      <span className="text-green-600">
                        {formatNumber(amounts.credit)}
                      </span>
                      <span>/</span>
                      <span className="text-red-600">
                        {formatNumber(amounts.debit)}
                      </span>
                      <span>=</span>
                      <span
                        className={
                          balance >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatNumber(balance)}
                      </span>
                    </div>
                  )
                }
              )}
            </div>
          )}
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
    <div className={`mb-4 ${className}`}>
      {totals.byCurrency && Object.keys(totals.byCurrency).length > 0 && (
        <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
          <div className="mb-2 text-sm font-medium text-muted-foreground">
            By Currency
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(totals.byCurrency).map(([currency, amounts]) => {
              const balance = amounts.credit - amounts.debit
              return (
                <div
                  key={currency}
                  className="flex items-center gap-2 rounded border px-3 py-1"
                >
                  <span className="font-semibold">{currency}:</span>
                  <span className="text-green-600">
                    ↑{formatNumber(amounts.credit)}
                  </span>
                  <span className="text-red-600">
                    ↓{formatNumber(amounts.debit)}
                  </span>
                  <span className="text-muted-foreground">=</span>
                  <span
                    className={`font-semibold ${
                      balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatNumber(balance)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 border-t pt-2 text-sm">
            <span className="font-semibold text-muted-foreground">
              Total RON:
            </span>
            <span className="text-green-600">
              ↑{formatNumber(totals.credit)}
            </span>
            <span className="text-red-600">↓{formatNumber(totals.debit)}</span>
            <span className="text-muted-foreground">=</span>
            <span
              className={`font-semibold ${
                totals.balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatNumber(totals.balance)} RON
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
