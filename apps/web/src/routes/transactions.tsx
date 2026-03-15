import { createFileRoute, redirect } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { DashboardLayout } from "../components/dashboard-layout"
import { useTransactions } from "../hooks/use-transactions"
import { authService } from "../services/auth.service"

export const Route = createFileRoute("/transactions")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: TransactionsPage,
})

function TransactionsPage() {
  const { data: transactions, isLoading, error } = useTransactions()

  return (
    <DashboardLayout
      currentPath="/transactions"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Transactions", isCurrentPage: true },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            View and manage all your financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Error loading transactions: {error.message}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading transactions...
              </div>
            </div>
          )}

          {!isLoading && !error && transactions && (
            <>
              {transactions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No transactions found
                </div>
              ) : (
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
                            {new Date(transaction.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell>{transaction.store || "-"}</TableCell>
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
                                transaction.creditDebitIndicator === "Credit"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {transaction.creditDebitIndicator}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              transaction.amount.sum > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount.sum > 0 ? "+" : ""}
                            {transaction.amount.sum.toFixed(2)}{" "}
                            {transaction.amount.currency}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
