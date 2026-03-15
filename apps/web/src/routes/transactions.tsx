import { createFileRoute } from "@tanstack/react-router"
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

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
})

// Mock transaction data based on the API model
const mockTransactions = [
  {
    id: "1",
    date: new Date("2026-03-05"),
    store: "Starbucks",
    notes: "Morning coffee",
    amount: { sum: -5.5, currency: "USD" },
    state: "sent",
    status: "Booked",
    creditDebitIndicator: "Debit",
    category: "Food & Drink",
    tags: ["Coffee", "Personal"],
  },
  {
    id: "2",
    date: new Date("2026-03-04"),
    store: "Amazon",
    notes: "Office supplies",
    amount: { sum: -124.99, currency: "USD" },
    state: "sent",
    status: "Booked",
    creditDebitIndicator: "Debit",
    category: "Shopping",
    tags: ["Business"],
  },
  {
    id: "3",
    date: new Date("2026-03-03"),
    store: "Client Payment",
    notes: "Project invoice #1234",
    amount: { sum: 2500.0, currency: "USD" },
    state: "received",
    status: "Booked",
    creditDebitIndicator: "Credit",
    category: "Income",
    tags: ["Work", "Invoice"],
  },
  {
    id: "4",
    date: new Date("2026-03-02"),
    store: "Electric Company",
    notes: "Monthly utilities",
    amount: { sum: -89.45, currency: "USD" },
    state: "sent",
    status: "Booked",
    creditDebitIndicator: "Debit",
    category: "Utilities",
    tags: ["Bills"],
  },
  {
    id: "5",
    date: new Date("2026-03-01"),
    store: "Grocery Store",
    notes: "Weekly groceries",
    amount: { sum: -156.32, currency: "USD" },
    state: "sent",
    status: "Booked",
    creditDebitIndicator: "Debit",
    category: "Groceries",
    tags: ["Food", "Personal"],
  },
  {
    id: "6",
    date: new Date("2026-02-28"),
    store: "Freelance Work",
    notes: "Consulting services",
    amount: { sum: 1200.0, currency: "USD" },
    state: "received",
    status: "Booked",
    creditDebitIndicator: "Credit",
    category: "Income",
    tags: ["Work"],
  },
  {
    id: "7",
    date: new Date("2026-02-27"),
    store: "Gas Station",
    notes: "Fuel",
    amount: { sum: -45.0, currency: "USD" },
    state: "sent",
    status: "Pending",
    creditDebitIndicator: "Debit",
    category: "Transportation",
    tags: ["Car"],
  },
  {
    id: "8",
    date: new Date("2026-02-26"),
    store: "Restaurant",
    notes: "Team dinner",
    amount: { sum: -78.5, currency: "USD" },
    state: "sent",
    status: "Booked",
    creditDebitIndicator: "Debit",
    category: "Food & Drink",
    tags: ["Business", "Meal"],
  },
]

function TransactionsPage() {
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
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{transaction.store}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.notes}
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
