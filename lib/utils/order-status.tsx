import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReactElement } from "react"

/**
 * Use outline so we don't inherit Badge's default `bg-primary` (green),
 * which otherwise shows through as "green inside / gray border".
 */
const statusBadge = (label: string, className: string): ReactElement => (
  <Badge variant="outline" className={cn("border-transparent", className)}>
    {label}
  </Badge>
)

/** Shared order workflow badge for list + detail pages. */
export const getOrderStatusBadge = (
  workflowState: string | null | undefined
): ReactElement => {
  const label = String(workflowState ?? "").trim()
  const s = label.toLowerCase()

  if (!label) {
    return statusBadge("—", "bg-muted text-muted-foreground")
  }

  if (s.includes("cancel")) {
    return statusBadge(label, "bg-red-500/10 text-red-700 dark:text-red-400")
  }

  if (s.includes("review") || s.includes("draft")) {
    return statusBadge(label, "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400")
  }

  if (s.includes("invoice")) {
    return statusBadge(label, "bg-green-500/10 text-green-700 dark:text-green-400")
  }

  if (s.includes("submit") || s.includes("confirm")) {
    return statusBadge(label, "bg-blue-500/10 text-blue-700 dark:text-blue-400")
  }

  return statusBadge(label, "bg-muted text-muted-foreground")
}
