import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Textarea } from "@workspace/ui/components/textarea"
import { Loader2, Receipt } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useUpdateTransaction } from "../../hooks/use-transactions"
import type { Transaction } from "../../types/transaction"

const transactionSchema = z.object({
  store: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["Booked", "Pending"]),
  creditDebitIndicator: z.enum(["Credit", "Debit"]),
  date: z.string(),
  amount: z.number(),
  currency: z.string(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsSheetProps) {
  const updateMutation = useUpdateTransaction()

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onChange",
  })

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        store: transaction.store || "",
        notes: transaction.notes || "",
        status: transaction.status,
        creditDebitIndicator: transaction.creditDebitIndicator,
        date: new Date(transaction.date).toISOString().split("T")[0],
        amount: transaction.amount.sum,
        currency: transaction.amount.currency,
      })
    }
  }, [transaction, form])

  const onSubmit = async (data: TransactionFormValues) => {
    if (!transaction) return

    try {
      await updateMutation.mutateAsync({
        id: transaction._id,
        data: {
          store: data.store,
          notes: data.notes,
          status: data.status,
          creditDebitIndicator: data.creditDebitIndicator,
          date: new Date(data.date).toISOString(),
          amount: {
            sum: data.amount,
            currency: data.currency,
          },
        },
      })

      toast.success("Transaction updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update transaction"
      )
    }
  }

  const handleAddReceipt = () => {
    // Placeholder for future functionality
    toast.info("Add receipt functionality coming soon")
  }

  if (!transaction) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            View and edit transaction information
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register("date")}
                  className={
                    form.formState.errors.date ? "border-destructive" : ""
                  }
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              {/* Store */}
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Input
                  id="store"
                  placeholder="Enter store name"
                  {...form.register("store")}
                  className={
                    form.formState.errors.store ? "border-destructive" : ""
                  }
                />
                {form.formState.errors.store && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.store.message}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("amount", { valueAsNumber: true })}
                    className={
                      form.formState.errors.amount ? "border-destructive" : ""
                    }
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    placeholder="USD"
                    maxLength={3}
                    {...form.register("currency")}
                    className={
                      form.formState.errors.currency ? "border-destructive" : ""
                    }
                  />
                  {form.formState.errors.currency && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.currency.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="creditDebitIndicator">Type</Label>
                <Select
                  value={form.watch("creditDebitIndicator")}
                  onValueChange={(value) =>
                    form.setValue(
                      "creditDebitIndicator",
                      value as "Credit" | "Debit",
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger
                    id="creditDebitIndicator"
                    className={
                      form.formState.errors.creditDebitIndicator
                        ? "border-destructive"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.creditDebitIndicator && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.creditDebitIndicator.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue("status", value as "Booked" | "Pending", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    id="status"
                    className={
                      form.formState.errors.status ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  rows={4}
                  {...form.register("notes")}
                  className={
                    form.formState.errors.notes ? "border-destructive" : ""
                  }
                />
                {form.formState.errors.notes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </div>
            </div>

            {/* Receipt Section */}
            <div className="border-t px-4 py-4">
              <div className="space-y-2">
                <Label>Receipt</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddReceipt}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Add Receipt
                </Button>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:space-x-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
