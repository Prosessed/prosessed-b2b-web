"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useInvoiceDetails } from "@/lib/api/hooks"
import {
  fetchSalesInvoicePdfBlob,
  useDefaultSalesInvoicePrintFormat,
  usePrintFormatsForDoctype,
} from "@/lib/api/print"
import { useAuth } from "@/lib/auth/context"
import { formatDate, formatPrice } from "@/lib/utils/currency"
import { ArrowLeft, Eye, FileText, Loader2, Package, Download, MapPin, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

function getInvoiceNumberFromDetails(details: any, fallback: string) {
  return details?.invoice_id ?? details?.name ?? details?.invoice ?? details?.docname ?? fallback
}

function renderInvoiceAddress(details: any) {
  const addressHtml =
    details?.customer_address ??
    details?.billing_address ??
    details?.address_display ??
    details?.address ??
    details?.customerAddress ??
    ""

  const normalized = String(addressHtml ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim()

  return normalized || "—"
}

function getItems(details: any) {
  if (Array.isArray(details?.invoice_items)) return details.invoice_items
  if (Array.isArray(details?.items)) return details.items
  if (Array.isArray(details?.sales_invoice_items)) return details.sales_invoice_items
  if (Array.isArray(details?.item_list)) return details.item_list
  return []
}

export default function MyInvoiceDetailPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : null
  const { user, isAuthenticated } = useAuth()

  const defaultPrintFormat = useDefaultSalesInvoicePrintFormat()
  const { data: printFormats = [] } = usePrintFormatsForDoctype("Sales Invoice")

  const [pdfLoading, setPdfLoading] = useState<"view" | "download" | null>(null)
  const [pdfError, setPdfError] = useState<string>("")
  const [selectedPrintFormat, setSelectedPrintFormat] = useState<string>(defaultPrintFormat)

  const { data: invoice, isLoading, error } = useInvoiceDetails(id)

  const currency = user?.defaultCurrency ?? "AUD"

  const invoiceNumber = useMemo(() => {
    if (!invoice) return id ?? ""
    return getInvoiceNumberFromDetails(invoice, id ?? "")
  }, [invoice, id])

  const resolvedPrintFormat = selectedPrintFormat || defaultPrintFormat

  // Keep selection stable, but auto-pick a valid default when formats arrive.
  useEffect(() => {
    if (!printFormats || printFormats.length === 0) return

    const currentValid = printFormats.some((f: any) => f?.name === selectedPrintFormat)
    if (currentValid) return

    const next =
      (printFormats?.find((f: any) => f?.name === defaultPrintFormat)?.name as string) ??
      printFormats?.[0]?.name ??
      defaultPrintFormat

    setSelectedPrintFormat(next)
  }, [printFormats, defaultPrintFormat, selectedPrintFormat])

  const handleViewPdf = useCallback(async () => {
    if (!user || !id) return
    setPdfError("")
    setPdfLoading("view")
    try {
      const { blob } = await fetchSalesInvoicePdfBlob({
        sid: user.sid,
        docname: String(invoiceNumber || id),
        printFormat: resolvedPrintFormat,
      })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      setPdfError(e?.message || "Failed to generate PDF. Please try again.")
    } finally {
      setPdfLoading(null)
    }
  }, [user, id, invoiceNumber, resolvedPrintFormat])

  const handleDownloadPdf = useCallback(async () => {
    if (!user || !id) return
    setPdfError("")
    setPdfLoading("download")
    try {
      const { blob, filename } = await fetchSalesInvoicePdfBlob({
        sid: user.sid,
        docname: String(invoiceNumber || id),
        printFormat: resolvedPrintFormat,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename || `${invoiceNumber || id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      setPdfError(e?.message || "Failed to download PDF. Please try again.")
    } finally {
      setPdfLoading(null)
    }
  }, [user, id, invoiceNumber, resolvedPrintFormat])

  const statusText = useMemo(() => {
    if (!invoice) return ""
    return invoice?.workflow_state ?? invoice?.status ?? invoice?.docstatus ?? ""
  }, [invoice])

  const statusBadge = useMemo(() => {
    const s = String(statusText ?? "").trim()
    const lower = s.toLowerCase()

    if (!s) return <Badge className="bg-muted text-muted-foreground">—</Badge>
    if (lower.includes("cancel")) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">{s}</Badge>
    if (lower.includes("draft") || lower.includes("review")) return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{s}</Badge>
    if (lower.includes("submit") || lower.includes("paid") || lower.includes("approved") || lower.includes("confirmed")) {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">{s}</Badge>
    }
    return <Badge className="bg-muted text-muted-foreground">{s}</Badge>
  }, [statusText])

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view this invoice</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </Card>
      </div>
    )
  }

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Invalid invoice</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/my-invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Invoices
          </Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive">Failed to load invoice details. Please try again.</p>
        </Card>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/my-invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Invoices
          </Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  const inv: any = invoice

  const invoiceDate = inv?.posting_date ?? inv?.transaction_date ?? inv?.issue_date ?? inv?.date ?? null
  const customerName = inv?.customer_name ?? inv?.customer ?? ""
  const items = getItems(inv)

  const address = renderInvoiceAddress(inv)

  const grandTotal = inv?.grand_total ?? inv?.amount ?? inv?.total ?? 0
  const netTotal = inv?.net_total ?? inv?.sub_total ?? inv?.subtotal ?? 0
  const taxes = inv?.total_taxes_and_charges ?? inv?.tax_amount ?? inv?.taxes ?? 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/my-invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Invoices
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Invoice #{invoiceNumber}</h1>
                  <p className="text-muted-foreground">Issued {formatDate(invoiceDate)}</p>
                </div>

                <div className="flex items-center gap-3">
                  {statusBadge}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center">
                      <Select
                        value={resolvedPrintFormat}
                        onValueChange={(value) => setSelectedPrintFormat(value)}
                        disabled={!printFormats || printFormats.length === 0}
                      >
                        <SelectTrigger className="w-[230px] rounded-xl">
                          <SelectValue placeholder="Print format" />
                        </SelectTrigger>
                        <SelectContent>
                          {printFormats.map((f: any) => (
                            <SelectItem key={String(f?.name ?? "")} value={String(f?.name ?? "")}>
                              {f?.name ?? "Print Format"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleViewPdf}
                      disabled={pdfLoading != null}
                      aria-label="View Sales Invoice PDF"
                    >
                      {pdfLoading === "view" ? (
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
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading != null}
                      aria-label="Download Sales Invoice PDF"
                    >
                      {pdfLoading === "download" ? (
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
                </div>
              </div>

              {pdfError && (
                <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {pdfError}
                </div>
              )}

              <div className="grid gap-4 mb-6">
                {customerName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium">{customerName}</p>
                      {inv?.customer_id && <p className="text-xs text-muted-foreground">{inv.customer_id}</p>}
                    </div>
                  </div>
                )}

                {inv?.customer_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{inv.customer_email}</p>
                    </div>
                  </div>
                )}

                {inv?.customer_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{inv.customer_phone}</p>
                    </div>
                  </div>
                )}

                {address !== "—" && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm whitespace-pre-wrap">{address}</p>
                    </div>
                  </div>
                )}

                {inv?.remarks && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Remarks</p>
                      <p className="text-sm">{inv.remarks}</p>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" /> Items ({items.length})
              </h3>

              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">No items</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item: any, idx: number) => {
                    const name = item?.item_name ?? item?.name ?? item?.item_code ?? `Item ${idx + 1}`
                    const qty = item?.qty ?? item?.quantity ?? item?.item_quantity ?? 0
                    const uom = item?.uom ?? item?.stock_uom ?? item?.uom_name ?? ""
                    const amount = item?.amount ?? item?.net_amount ?? item?.item_amount ?? 0
                    return (
                      <div key={item?.name ?? item?.item_code ?? idx} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {qty} {uom}
                          </p>
                          {item?.warehouse && <p className="text-xs text-muted-foreground">{item.warehouse}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium">{formatPrice(Number(amount) || 0, currency)}</p>
                          {item?.rate != null && <p className="text-xs text-muted-foreground">@ {formatPrice(Number(item.rate) || 0, currency)}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Summary</h3>
              <div className="space-y-2">
                {netTotal != null && Number(netTotal) !== Number(grandTotal) && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net Total</span>
                    <span>{formatPrice(Number(netTotal) || 0, currency)}</span>
                  </div>
                )}

                {taxes != null && Number(taxes) !== 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>{formatPrice(Number(taxes) || 0, currency)}</span>
                  </div>
                )}

                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(Number(grandTotal) || 0, currency)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

