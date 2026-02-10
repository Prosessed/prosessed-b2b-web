"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useOrderDetails } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { ArrowLeft, Package, FileText, User, MapPin, Phone, Mail } from "lucide-react"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function OrderDetailPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : null
  const { user } = useAuth()
  const { data: order, isLoading, error } = useOrderDetails(id)
  const currency = user?.defaultCurrency ?? "AUD"

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Invalid order</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive">Failed to load order. Please try again.</p>
        </Card>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !order) {
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

  const m = order as any
  const orderId = m.order_id ?? m.name ?? id
  const orderDate = m.order_date ?? m.transaction_date
  const items = Array.isArray(m.order_items) ? m.order_items : (m.items ?? [])
  const invoices = Array.isArray(m.invoices) ? m.invoices : []
  const grandTotal = m.order_grand_total ?? m.grand_total ?? 0
  const netTotal = m.order_net_total ?? m.order_total ?? m.net_total ?? 0
  const taxes = m.order_total_taxes_and_charges ?? m.total_taxes_and_charges ?? 0
  const workflowStatus = m.order_workflow_status ?? m.workflow_status ?? m.workflow_state
  const docStatus = m.order_doc_status ?? m.docstatus
  const address = (m.customer_address ?? "").replace(/<br\s*\/?>/gi, "\n").trim() || "—"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{orderId}</h1>
                  <p className="text-muted-foreground">{formatDate(orderDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {workflowStatus && (
                    <Badge className="bg-primary/10 text-primary">{workflowStatus}</Badge>
                  )}
                  {docStatus != null && (
                    <span className="text-xs text-muted-foreground">
                      Doc status: {docStatus === 1 ? "Submitted" : docStatus === 0 ? "Draft" : "Cancelled"}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 mb-6">
                {m.customer_name && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium">{m.customer_name}</p>
                      {m.customer_id && <p className="text-xs text-muted-foreground">{m.customer_id}</p>}
                    </div>
                  </div>
                )}
                {m.customer_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{m.customer_email}</p>
                    </div>
                  </div>
                )}
                {m.customer_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{m.customer_phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm whitespace-pre-wrap">{address}</p>
                  </div>
                </div>
                {m.sales_person_list && (
                  <div>
                    <p className="text-xs text-muted-foreground">Sales person</p>
                    <p className="text-sm">{m.sales_person_list}</p>
                  </div>
                )}
                {m.order_note && (
                  <div>
                    <p className="text-xs text-muted-foreground">Note</p>
                    <p className="text-sm">{m.order_note}</p>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" /> Order Items ({items.length})
              </h3>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No items</p>
                ) : (
                  items.map((item: any, idx: number) => (
                    <div key={item.item_code || idx} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="relative h-16 w-16 rounded overflow-hidden bg-muted shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.item_name || "Item"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.item_name || item.item_code}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.item_quantity ?? item.qty ?? item.quantity ?? 0} · {item.uom || item.stock_uom || ""}
                        </p>
                        {item.warehouse && <p className="text-xs text-muted-foreground">{item.warehouse}</p>}
                        {item.applicable_gst && <p className="text-xs text-muted-foreground">{item.applicable_gst}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatPrice(item.amount ?? item.net_amount ?? 0, currency)}</p>
                        {item.rate != null && (
                          <p className="text-xs text-muted-foreground">@ {formatPrice(item.rate, currency)}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {invoices.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Invoices
                </h3>
                <ul className="space-y-2">
                  {invoices.map((inv: any) => (
                    <li key={inv.name || inv.invoice} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="font-medium">{inv.name || inv.invoice}</span>
                      <span>{formatPrice(inv.grand_total ?? inv.amount ?? 0, currency)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Summary</h3>
              <div className="space-y-2">
                {netTotal != null && netTotal !== grandTotal && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net Total</span>
                    <span>{formatPrice(netTotal, currency)}</span>
                  </div>
                )}
                {taxes != null && taxes !== 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>{formatPrice(taxes, currency)}</span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(grandTotal, currency)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
