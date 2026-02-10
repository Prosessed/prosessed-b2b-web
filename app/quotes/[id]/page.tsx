"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuotationDetails } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { ArrowLeft, FileText, MapPin, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function QuoteDetailPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : null
  const { user } = useAuth()
  const { data: quote, isLoading, error } = useQuotationDetails(id)
  const currency = user?.defaultCurrency ?? "AUD"

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Invalid quote</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/quotes"><ArrowLeft className="mr-2 h-4 w-4" />Back to Quotes</Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-destructive">Failed to load quote. Please try again.</p>
        </Card>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/quotes"><ArrowLeft className="mr-2 h-4 w-4" />Back to Quotes</Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !quote) {
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

  const q = quote as any
  const name = q.name ?? q.quotation_id ?? id
  const creation = q.creation ?? q.transaction_date ?? q.quotation_date ?? q.date
  const validTill = q.valid_till ?? q.valid_until
  const status = q.workflow_state ?? q.quotation_status ?? q.status ?? "—"
  const grandTotal = q.grand_total ?? q.quotation_grand_total ?? q.total ?? 0
  const inWords = q.in_words ?? ""
  const addressHtml = q.address_display ?? ""
  const addressText = q.customer_address ?? ""
  const address = addressText || addressHtml.replace(/<br\s*\/?>/gi, "\n").trim() || "—"
  const items = Array.isArray(q.quotation_items) ? q.quotation_items : (Array.isArray(q.items) ? q.items : (q.order_items ?? []))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/quotes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Quote #{name}</h1>
                  <p className="text-muted-foreground">Created {formatDate(creation)}</p>
                  {validTill && (
                    <p className="text-sm text-muted-foreground">Valid until {formatDate(validTill)}</p>
                  )}
                </div>
                <Badge className="bg-primary/10 text-primary">{status}</Badge>
              </div>

              {q.customer_name && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{q.customer_name}</p>
                </div>
              )}

              {address !== "—" && (
                <div className="mb-4 flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm whitespace-pre-wrap">{address}</p>
                  </div>
                </div>
              )}

              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" /> Items ({items.length})
              </h3>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No items</p>
                ) : (
                  items.map((item: any, idx: number) => (
                    <div key={item.name ?? item.item_code ?? idx} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="relative h-14 w-14 rounded overflow-hidden bg-muted shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.item_name || "Item"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.item_name ?? item.item_code}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.qty ?? item.quantity ?? item.item_quantity ?? 0} {item.uom ?? item.stock_uom ?? ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium">{formatPrice(item.amount ?? item.net_amount ?? 0, currency)}</p>
                        {item.rate != null && <p className="text-xs text-muted-foreground">@ {formatPrice(item.rate, currency)}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPrice(grandTotal, currency)}</span>
                </div>
                {inWords && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">{inWords}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
