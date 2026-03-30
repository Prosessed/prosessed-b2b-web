"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAllInvoices } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatDate, formatPrice } from "@/lib/utils/currency"
import { FileText, Package } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

function getInvoiceNumber(invoice: any, fallback: string) {
  return invoice?.invoice_id ?? invoice?.name ?? invoice?.invoice ?? invoice?.docname ?? fallback
}

function getInvoiceStatusBadge(status: string | null | undefined) {
  const s = String(status ?? "").trim()
  const lower = s.toLowerCase()

  if (!s) return <Badge className="bg-muted text-muted-foreground">—</Badge>
  if (lower.includes("cancel")) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">{s}</Badge>
  if (lower.includes("draft") || lower.includes("review")) return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{s}</Badge>
  if (lower.includes("submit") || lower.includes("confirmed") || lower.includes("paid") || lower.includes("approved")) {
    return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">{s}</Badge>
  }
  return <Badge className="bg-muted text-muted-foreground">{s}</Badge>
}

export default function MyInvoicesPage() {
  const { user, isAuthenticated } = useAuth()
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useAllInvoices({ page, pageSize })

  const invoices = Array.isArray(data?.invoices) ? data?.invoices : []
  const pagination = data?.pagination
  const totalRecords = pagination?.total_records

  const totalPages = useMemo(() => {
    if (typeof totalRecords !== "number" || totalRecords < 0) return null
    return Math.max(1, Math.ceil(totalRecords / pageSize))
  }, [totalRecords, pageSize])

  const hasPrevPage = page > 1
  const hasNextPage = useMemo(() => {
    if (typeof totalPages === "number") return page < totalPages
    if (typeof pagination?.has_next_page === "boolean") return pagination.has_next_page
    return false
  }, [page, totalPages, pagination?.has_next_page])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view invoices</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const currency = user.defaultCurrency ?? "AUD"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Invoices</h1>
            <p className="text-muted-foreground">View and download your Sales Invoices</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Items per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const next = Number(value)
                if (!PAGE_SIZE_OPTIONS.includes(next as any)) return
                setPageSize(next as (typeof PAGE_SIZE_OPTIONS)[number])
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[110px] rounded-xl">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Card className="mb-6 p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">Failed to load invoices. Please try again.</p>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </Card>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting the page size.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((inv: any, idx: number) => {
              const invoiceNumber = getInvoiceNumber(inv, String(idx))
              const status = inv?.workflow_state ?? inv?.status ?? inv?.invoice_status ?? ""
              const amount = inv?.grand_total ?? inv?.amount ?? inv?.total ?? inv?.net_total ?? 0
              const dateStr = inv?.transaction_date ?? inv?.posting_date ?? inv?.issue_date ?? inv?.date ?? null

              return (
                <Card key={String(invoiceNumber)} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg truncate">Invoice #{invoiceNumber}</h3>
                        {getInvoiceStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(dateStr)}{inv?.customer_name ? ` · ${inv.customer_name}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                      <p className="text-2xl font-bold text-primary tabular-nums">{formatPrice(Number(amount) || 0, currency)}</p>
                      <Button variant="outline" asChild aria-label={`View invoice ${invoiceNumber} details`}>
                        <Link href={`/my-invoices/${encodeURIComponent(String(invoiceNumber))}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && invoices.length > 0 && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              aria-label="Previous page"
            >
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Page {page}
              {typeof totalPages === "number" ? ` of ${totalPages}` : ""}
              {typeof totalRecords === "number" ? ` · ${totalRecords} total` : ""}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!hasNextPage) return
                setPage((p) => p + 1)
              }}
              disabled={!hasNextPage}
              aria-label="Next page"
            >
              {hasNextPage ? (
                "Next"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

