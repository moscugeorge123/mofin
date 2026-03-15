import { createFileRoute, redirect } from "@tanstack/react-router"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
import { useState } from "react"
import { BankAccountDialog } from "../components/bank-account-dialog"
import { DashboardLayout } from "../components/dashboard-layout"
import { useBankAccounts } from "../hooks/use-bank-accounts"
import { authService } from "../services/auth.service"

export const Route = createFileRoute("/bank-accounts")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined" && !authService.isAuthenticated()) {
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
  },
  component: BankAccountsPage,
})

function BankAccountsPage() {
  const { data: bankAccounts, isLoading, error } = useBankAccounts()
  const [dialogOpen, setDialogOpen] = useState(false)

  const getAccountTypeBadgeVariant = (type: string) => {
    return type === "Business" ? "default" : "secondary"
  }

  const getSubTypeBadgeVariant = (subType: string) => {
    switch (subType) {
      case "CurrentAccount":
        return "default"
      case "Savings":
        return "secondary"
      case "CreditCard":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatSubType = (subType: string) => {
    switch (subType) {
      case "CurrentAccount":
        return "Current Account"
      case "Savings":
        return "Savings"
      case "CreditCard":
        return "Credit Card"
      default:
        return subType
    }
  }

  return (
    <DashboardLayout
      currentPath="/bank-accounts"
      breadcrumbItems={[
        { label: "Dashboard", href: "/" },
        { label: "Bank Accounts", isCurrentPage: true },
      ]}
    >
      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
      />

      <div className="mb-4 flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}>Create Account</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Bank Accounts</CardTitle>
          <CardDescription>
            View and manage all your connected bank accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Error loading bank accounts: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading bank accounts...
              </div>
            </div>
          )}

          {!isLoading && !error && bankAccounts && (
            <>
              {bankAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 text-sm text-muted-foreground">
                    No bank accounts found
                  </div>
                  <Button onClick={() => setDialogOpen(true)}>
                    Create Your First Account
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sub Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account._id}>
                        <TableCell className="font-medium">
                          {account.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.bankAccountId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getAccountTypeBadgeVariant(account.type)}
                          >
                            {account.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getSubTypeBadgeVariant(account.subType)}
                          >
                            {formatSubType(account.subType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {account.currency}
                        </TableCell>
                        <TableCell>
                          {account.description || (
                            <span className="text-muted-foreground italic">
                              No description
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(account.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
