import { Button } from "@workspace/ui/components/button"

interface EmptyStateProps {
  message: string
  actionLabel: string
  onAction: () => void
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 text-sm text-muted-foreground">{message}</div>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  )
}
