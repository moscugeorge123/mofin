import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Pencil, Trash2 } from "lucide-react"
import { useGroupTotals } from "../hooks/use-categories"
import { formatNumber } from "../lib/utils"
import type { Category } from "../types/category"

interface GroupCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onClick?: (category: Category) => void
}

export function GroupCard({
  category,
  onEdit,
  onDelete,
  onClick,
}: GroupCardProps) {
  const { data: totals, isLoading: totalsLoading } = useGroupTotals(
    category._id
  )
  return (
    <Card
      className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md"
      onClick={() => onClick?.(category)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="shrink-0 text-3xl">{category.icon || "💰"}</div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg">
                {category.name}
              </CardTitle>
              {category.description && (
                <CardDescription className="mt-1 line-clamp-2 text-xs">
                  {category.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(category)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(category)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Transaction Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Transactions</span>
          <Badge variant="secondary">{category.transactionCount || 0}</Badge>
        </div>

        {/* Currency breakdown */}
        {totalsLoading ? (
          <div className="h-6 animate-pulse rounded bg-muted" />
        ) : totals &&
          totals.byCurrency &&
          Object.keys(totals.byCurrency).length > 0 ? (
          <div className="flex flex-col gap-1">
            {Object.entries(totals.byCurrency).map(([currency, amounts]) => {
              const balance = amounts.credit - amounts.debit
              return (
                <div
                  key={currency}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-muted-foreground">
                    {currency}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600">
                      ↑{formatNumber(amounts.credit)}
                    </span>
                    <span className="text-red-600">
                      ↓{formatNumber(amounts.debit)}
                    </span>
                    <span className="text-muted-foreground">=</span>
                    <span
                      className={`font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatNumber(balance)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between border-t pt-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Total RON
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600">
                  ↑{formatNumber(totals.credit)}
                </span>
                <span className="text-red-600">
                  ↓{formatNumber(totals.debit)}
                </span>
                <span className="text-muted-foreground">=</span>
                <span
                  className={`font-semibold ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatNumber(totals.balance)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Rules Section */}
        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Automation Rules</span>
            <Badge variant="outline">{category.rules.length || 0}</Badge>
          </div>

          {category.rules.length > 0 && (
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
              {category.rules.slice(0, 3).map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Badge variant="secondary" className="text-[10px]">
                    {rule.field}
                  </Badge>
                  <span>{rule.operator}</span>
                  <span className="truncate font-medium text-foreground">
                    {Array.isArray(rule.value)
                      ? rule.value.join(" - ")
                      : rule.value}
                  </span>
                </div>
              ))}
              {category.rules.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{category.rules.length - 3} more rules
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
