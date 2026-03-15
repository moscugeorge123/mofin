import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  useCreateBankAccount,
  useUpdateBankAccount,
} from "../hooks/use-bank-accounts"
import type { BankAccount } from "../types/bank-account"

const bankAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters (e.g., USD, EUR, RON)")
    .toUpperCase(),
  type: z.enum(["Personal", "Business"], {
    required_error: "Please select an account type",
  }),
  subType: z.enum(["CurrentAccount", "Savings", "CreditCard"], {
    required_error: "Please select a sub type",
  }),
})

type BankAccountFormValues = z.infer<typeof bankAccountSchema>

interface BankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: BankAccount
  mode?: "create" | "edit"
}

export function BankAccountDialog({
  open,
  onOpenChange,
  account,
  mode = "create",
}: BankAccountDialogProps) {
  const createMutation = useCreateBankAccount()
  const updateMutation = useUpdateBankAccount()

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      currency: "",
      type: "Personal",
      subType: "CurrentAccount",
    },
  })

  // Reset form when dialog opens/closes or account changes
  useEffect(() => {
    if (open && account && mode === "edit") {
      form.reset({
        name: account.name,
        description: account.description || "",
        currency: account.currency,
        type: account.type,
        subType: account.subType,
      })
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        description: "",
        currency: "",
        type: "Personal",
        subType: "CurrentAccount",
      })
    }
  }, [open, account, mode, form])

  const onSubmit = async (data: BankAccountFormValues) => {
    try {
      if (mode === "edit" && account) {
        await updateMutation.mutateAsync({ id: account._id, data })
        toast.success("Bank account updated successfully")
      } else {
        await createMutation.mutateAsync(data)
        toast.success("Bank account created successfully")
      }
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} bank account`)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl min-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Bank Account" : "Create Bank Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the details of your bank account."
              : "Add a new bank account to your profile."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Checking" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Display name for this account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Personal daily expenses account"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="USD"
                        maxLength={3}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      ISO 4217 code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subType"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Sub Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CurrentAccount">
                          Current Account
                        </SelectItem>
                        <SelectItem value="Savings">Savings</SelectItem>
                        <SelectItem value="CreditCard">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading
                  ? mode === "edit"
                    ? "Updating..."
                    : "Creating..."
                  : mode === "edit"
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
