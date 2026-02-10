"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useQuotations } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react"
import Link from "next/link"

export default function QuotesPage() {
  const { user, isAuthenticated } = useAuth()
  const { data: quotations = [], isLoading, error } = useQuotations()
  const currency = user?.defaultCurrency ?? "AUD"

  const getStatusIcon = (status: string) => {
    if (/approved|ordered|open/i.test(status)) return <CheckCircle className="h-4 w-4" />
    if (/reject|cancel/i.test(status)) return <XCircle className="h-4 w-4" />
    if (/expired/i.test(status)) return <Clock className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    if (/approved|ordered|open/i.test(status)) return "bg-green-500/10 text-green-700 dark:text-green-400"
    if (/reject|cancel/i.test(status)) return "bg-red-500/10 text-red-700 dark:text-red-400"
    if (/expired/i.test(status)) return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view quotes</p>
          <Button asChild><Link href="/login">Sign In</Link></Button>
        </Card>
      </div>
    )
  }

  const list = Array.isArray(quotations) ? quotations : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Quotes</h1>
            <p className="text-muted-foreground">Manage your quotations</p>
          </div>
          <Button asChild size="lg">
            <Link href="/cart">Request New Quote</Link>
          </Button>
        </div>

        {error && (
          <Card className="mb-6 p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">Failed to load quotes. Please try again.</p>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-4" />
                <div className="h-4 w-full bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-6">Request a quote from the cart</p>
            <Button asChild><Link href="/products">Browse Products</Link></Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {list.map((q: any) => (
              <Card key={q.name} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                      <h3 className="font-bold text-lg">Quote #{q.name}</h3>
                      <Badge className={getStatusColor(q.workflow_state ?? q.status ?? "")}>
                        {getStatusIcon(q.workflow_state ?? q.status ?? "")}
                        <span className="ml-1 capitalize">{q.workflow_state ?? q.status ?? "—"}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Created {formatDate(q.creation)}
                    </p>
                    {q.customer_name && (
                      <p className="text-sm text-muted-foreground">Customer: {q.customer_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end gap-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(q.grand_total ?? 0, currency)}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quotes/${q.name}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
