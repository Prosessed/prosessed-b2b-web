"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DateInput } from "@/components/ui/date-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSalesPersonOrders } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { fetchSalesOrderPdfBlob, useDefaultSalesOrderPrintFormat } from "@/lib/api/print"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { toLocalISODate, toLocalISODateDaysAgo } from "@/lib/utils/date"
import { getOrderStatusBadge } from "@/lib/utils/order-status"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Download, Eye, Loader2, Package } from "lucide-react"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "This month", getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end: now }
  }},
  { label: "Last 3 months", days: 90 },
] as const

const defaultEnd = toLocalISODate()
const defaultStart = toLocalISODateDaysAgo(30)

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const defaultPrintFormat = useDefaultSalesOrderPrintFormat()
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activePresetIndex, setActivePresetIndex] = useState<number>(1) // default: Last 30 days
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20)
  const [pdfLoadingState, setPdfLoadingState] = useState<{ orderId: string; action: "view" | "download" } | null>(null)
  const [pdfError, setPdfError] = useState<string>("")

  const { data, isLoading, error } = useSalesPersonOrders({
    page,
    pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })
  const orders = data?.sales_orders ?? []
  const totalRecords = data?.total_sales_order_count

  const totalPages = useMemo(() => {
    if (typeof totalRecords !== "number" || totalRecords < 0) return null
    return Math.max(1, Math.ceil(totalRecords / pageSize))
  }, [totalRecords, pageSize])

  const hasPrevPage = page > 1
  const hasNextPage = useMemo(() => {
    if (typeof totalPages === "number") return page < totalPages
    return orders.length >= pageSize
  }, [page, totalPages, orders.length, pageSize])

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value)
    setActivePresetIndex(-1)
    setPage(1)
  }, [])

  const handleEndDateChange = useCallback((value: string) => {
    setEndDate(value)
    setActivePresetIndex(-1)
    setPage(1)
  }, [])

  const handleViewPdf = useCallback(async (orderId: string) => {
    if (!user) return
    setPdfError("")
    setPdfLoadingState({ orderId, action: "view" })
    try {
      const { blob } = await fetchSalesOrderPdfBlob({
        sid: user.sid,
        docname: orderId,
        printFormat: defaultPrintFormat,
      })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      setPdfError(e?.message || "Failed to generate PDF. Please try again.")
    } finally {
      setPdfLoadingState(null)
    }
  }, [user, defaultPrintFormat])

  const handleDownloadPdf = useCallback(async (orderId: string) => {
    if (!user) return
    setPdfError("")
    setPdfLoadingState({ orderId, action: "download" })
    try {
      const { blob, filename } = await fetchSalesOrderPdfBlob({
        sid: user.sid,
        docname: orderId,
        printFormat: defaultPrintFormat,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || `${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      setPdfError(e?.message || "Failed to download PDF. Please try again.")
    } finally {
      setPdfLoadingState(null)
    }
  }, [user, defaultPrintFormat])

  const applyPreset = useCallback((presetIndex: number, preset: (typeof PRESETS)[number]) => {
    if ("days" in preset && preset.days) {
      setEndDate(toLocalISODate())
      setStartDate(toLocalISODateDaysAgo(preset.days))
    } else if ("getRange" in preset && preset.getRange) {
      const { start, end } = preset.getRange()
      setStartDate(toLocalISODate(start))
      setEndDate(toLocalISODate(end))
    }
    setActivePresetIndex(presetIndex)
    setPage(1)
  }, [])

  const handleResetDateRange = useCallback(() => {
    setStartDate(defaultStart)
    setEndDate(defaultEnd)
    setActivePresetIndex(1)
    setPage(1)
  }, [])

  const getStatusBadge = (workflowState: string) => getOrderStatusBadge(workflowState)

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your orders</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">View your sales orders</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Items per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const next = Number(value)
                if (!PAGE_SIZE_OPTIONS.includes(next as (typeof PAGE_SIZE_OPTIONS)[number])) return
                setPageSize(next as (typeof PAGE_SIZE_OPTIONS)[number])
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[110px] rounded-xl" aria-label="Orders per page">
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

        {/* Date range filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-4 sm:p-6 border-2 border-primary/10 bg-linear-to-br from-background to-muted/20">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-5 w-5 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Date range
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label htmlFor="orders-start" className="text-xs font-semibold text-muted-foreground block">
                    From
                  </label>
                  <DateInput
                    id="orders-start"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-border/60 bg-background focus:border-primary transition-colors cursor-pointer"
                    aria-label="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="orders-end" className="text-xs font-semibold text-muted-foreground block">
                    To
                  </label>
                  <DateInput
                    id="orders-end"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-border/60 bg-background focus:border-primary transition-colors cursor-pointer"
                    aria-label="End date"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, i) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={activePresetIndex === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(i, preset)}
                    className="rounded-full font-semibold cursor-pointer transition-all"
                    aria-label={`Filter by ${preset.label}`}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {error && (
          <Card className="mb-6 p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">Failed to load orders. Please try again.</p>
          </Card>
        )}
        {pdfError && (
          <Card className="mb-6 p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{pdfError}</p>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No orders in this range</h3>
            <p className="text-muted-foreground mb-6">Try a different date range</p>
            <Button
              variant="outline"
              onClick={handleResetDateRange}
              className="cursor-pointer"
              aria-label="Reset date range to last 30 days"
            >
              Reset to last 30 days
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: any) => {
              const isLoadingThisOrder = pdfLoadingState?.orderId === order.name
              const isViewLoading = isLoadingThisOrder && pdfLoadingState?.action === "view"
              const isDownloadLoading = isLoadingThisOrder && pdfLoadingState?.action === "download"
              return (
                <Link key={order.name} href={`/orders/${order.name}`} className="block group">
                  <Card className="p-6 hover:shadow-lg transition-shadow hover:border-primary/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {order.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name || "—"} · {formatDate(order.transaction_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewPdf(order.name)
                          }}
                          disabled={isLoadingThisOrder}
                          aria-label={`View ${order.name} PDF`}
                        >
                          {isViewLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View PDF
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDownloadPdf(order.name)
                          }}
                          disabled={isLoadingThisOrder}
                          aria-label={`Download ${order.name} PDF`}
                        >
                          {isDownloadLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                      {getStatusBadge(order.workflow_state)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Grand Total</p>
                      <p className="text-lg font-bold text-primary">{formatPrice(order.grand_total ?? 0, user?.defaultCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery</p>
                      <p className="text-sm font-medium">{formatDate(order.delivery_date)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 sm:hidden">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleViewPdf(order.name)
                      }}
                      disabled={isLoadingThisOrder}
                      aria-label={`View ${order.name} PDF`}
                    >
                      {isViewLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View PDF
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDownloadPdf(order.name)
                      }}
                      disabled={isLoadingThisOrder}
                      aria-label={`Download ${order.name} PDF`}
                    >
                      {isDownloadLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-end pt-4 border-t">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {!isLoading && orders.length > 0 && (
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
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
