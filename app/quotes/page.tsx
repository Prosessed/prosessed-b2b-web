import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getAuthSession } from "@/lib/auth/storage.client"
import { QuoteModel } from "@/lib/models/quote"
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function QuotesPage() {
  const session = await getAuthSession()
  if (!session?.user) {
    redirect("/login")
  }

  const quotes = await QuoteModel.getAll()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "expired":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "expired":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Quotes</h1>
            <p className="text-muted-foreground">Manage your bulk order quotes</p>
          </div>
          <Button asChild size="lg">
            <Link href="/cart">Request New Quote</Link>
          </Button>
        </div>

        {quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-6">Request a quote for bulk orders and special pricing</p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Quote Header */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Quote #{quote.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested on{" "}
                          {new Date(quote.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Valid until{" "}
                          {new Date(quote.validUntil).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Quote Items */}
                    <div className="space-y-2 mb-4">
                      {quote.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} {item.uom}
                            </p>
                          </div>
                          <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quote Status & Actions */}
                  <div className="flex flex-col items-start lg:items-end gap-4">
                    <Badge className={`${getStatusColor(quote.status)} flex items-center gap-1 px-3 py-1`}>
                      {getStatusIcon(quote.status)}
                      <span className="capitalize">{quote.status}</span>
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-2xl font-bold">${quote.total.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/quotes/${quote.id}`}>View Details</Link>
                      </Button>
                      {quote.status === "approved" && (
                        <Button size="sm" asChild>
                          <Link href={`/checkout?quote=${quote.id}`}>Proceed to Order</Link>
                        </Button>
                      )}
                    </div>
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
