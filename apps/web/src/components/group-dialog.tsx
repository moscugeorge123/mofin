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
import { Textarea } from "@workspace/ui/components/textarea"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useCreateCategory, useUpdateCategory } from "../hooks/use-categories"
import type { GroupFormValues } from "../schemas/group-schema"
import { groupSchema } from "../schemas/group-schema"
import type { Category, CategoryRule } from "../types/category"
import { CategoryRuleEditor } from "./category-rule-editor"
import { EmojiPicker } from "./emoji-picker"

interface GroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  mode?: "create" | "edit"
}

export function GroupDialog({
  open,
  onOpenChange,
  category,
  mode = "create",
}: GroupDialogProps) {
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const [rules, setRules] = useState<CategoryRule[]>([])

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      color: "#808080",
      icon: "💰",
      rules: [],
    },
  })

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open && category && mode === "edit") {
      form.reset({
        name: category.name,
        description: category.description || "",
        color: category.color || "#808080",
        icon: category.icon || "💰",
        rules: category.rules,
      })
      setRules(category.rules)
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        description: "",
        color: "#808080",
        icon: "💰",
        rules: [],
      })
      setRules([])
    }
  }, [open, category, mode, form])

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const payload = {
        ...data,
        color: data.color || "#808080",
        rules: rules,
      }

      if (mode === "edit" && category) {
        await updateMutation.mutateAsync({ id: category._id, data: payload })
        toast.success("Group updated successfully")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Group created successfully")
      }
      onOpenChange(false)
      form.reset()
      setRules([])
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} group`)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl min-w-xl overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Group" : "Create Group"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the details of your transaction group."
              : "Create a new group to organize your transactions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Groceries, Entertainment"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    A descriptive name for this group
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
                    <Textarea
                      placeholder="Add a description for this group..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="h-10 w-10 cursor-pointer p-1"
                        />
                        <Input
                          placeholder="#808080"
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Choose a color to identify this group
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <EmojiPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Choose an emoji to represent this group
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CategoryRuleEditor rules={rules} onRulesChange={setRules} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === "edit"
                    ? "Updating..."
                    : "Creating..."
                  : mode === "edit"
                    ? "Update Group"
                    : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
