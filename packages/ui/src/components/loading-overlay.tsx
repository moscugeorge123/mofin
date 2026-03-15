import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
