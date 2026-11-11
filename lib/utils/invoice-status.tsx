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

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return ""
}

/**
 * Prefer ERPNext payment status (Paid / Unpaid / Overdue) over workflow_state
 * like "Invoiced", which is not useful on the customer invoice list.
 */
export const resolveInvoiceStatus = (invoice: unknown): string => {
  if (!invoice || typeof invoice !== "object") return ""
  const inv = invoice as Record<string, unknown>

  const paymentStatus = firstNonEmptyString(
    inv.status,
    inv.invoice_status,
    inv.payment_status
  )

  // Ignore non-payment labels that sometimes appear in `status`.
  if (paymentStatus && !/^invoiced$/i.test(paymentStatus)) {
    return paymentStatus
  }

  const outstanding = Number(inv.outstanding_amount)
  const grandTotal = Number(inv.grand_total ?? inv.amount ?? inv.total ?? 0)
  if (Number.isFinite(outstanding)) {
    if (outstanding > 0) return "Unpaid"
    if (outstanding === 0 && Number.isFinite(grandTotal) && grandTotal > 0) {
      return "Paid"
    }
  }

  const workflow = firstNonEmptyString(inv.workflow_state)
  if (workflow && !/^invoiced$/i.test(workflow)) return workflow

  // "Invoiced" is a workflow label, not a payment state — show Unpaid for customers.
  if (/^invoiced$/i.test(paymentStatus) || /^invoiced$/i.test(workflow)) {
    return "Unpaid"
  }

  return firstNonEmptyString(inv.docstatus)
}

/**
 * Invoice status badge colors.
 * Important: check "unpaid" before "paid" — `"unpaid".includes("paid")` is true.
 */
export const getInvoiceStatusBadge = (
  status: string | null | undefined
): ReactElement => {
  const s = String(status ?? "").trim()
  const lower = s.toLowerCase()

  if (!s) {
    return statusBadge("—", "bg-muted text-muted-foreground")
  }

  if (lower.includes("cancel")) {
    return statusBadge(s, "bg-red-500/10 text-red-700 dark:text-red-400")
  }

  // Unpaid / overdue / partial — must run before the "paid" success check.
  if (
    lower.includes("unpaid") ||
    lower.includes("overdue") ||
    lower.includes("outstanding") ||
    lower.includes("partly paid") ||
    lower.includes("partially paid")
  ) {
    return statusBadge(s, "bg-amber-500/10 text-amber-800 dark:text-amber-400")
  }

  if (lower.includes("draft") || lower.includes("review")) {
    return statusBadge(s, "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400")
  }

  // Whole-word "paid" so "unpaid" cannot match; keep prior success statuses.
  if (
    /\bpaid\b/.test(lower) ||
    lower.includes("submit") ||
    lower.includes("confirmed") ||
    lower.includes("approved")
  ) {
    return statusBadge(s, "bg-green-500/10 text-green-700 dark:text-green-400")
  }

  return statusBadge(s, "bg-muted text-muted-foreground")
}
