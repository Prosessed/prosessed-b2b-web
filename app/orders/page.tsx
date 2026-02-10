"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Package, TrendingUp, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { useQuotations } from "@/lib/api/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import type React from "react"

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const { data: quotations, isLoading, error } = useQuotations()

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

  const getStatusBadge = (quotation: any) => {
    if (quotation.docstatus === 0) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      )
    }
    if (quotation.docstatus === 1) {
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          <Package className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      )
    }
    if (quotation.docstatus === 2) {
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
          <TrendingUp className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      )
    }
    return (
      <Badge>
        <Package className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">View and manage your quotations and orders</p>
        </div>

        {error && (
          <Card className="mb-6 p-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive">Failed to load orders. Please try again.</p>
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
        ) : !quotations || quotations.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to create your first order
            </p>
            <Button asChild>
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {quotations.map((quotation: any) => (
              <Link
                key={quotation.name}
                href={`/quotes/${quotation.name}`}
                className="block group"
              >
                <Card className="p-6 hover:shadow-lg transition-shadow hover:border-primary/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        Quote #{quotation.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quotation.creation).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {getStatusBadge(quotation)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-lg font-bold text-primary">
                        ${(quotation.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Items</p>
                      <p className="text-lg font-bold">
                        {quotation.items?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tax</p>
                      <p className="text-lg font-bold">
                        ${(quotation.taxes_and_charges || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Customer</p>
                      <p className="text-sm font-semibold truncate">
                        {quotation.customer_name || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {quotation.items && quotation.items.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {quotation.items.slice(0, 2).map((item: any) => item.item_name).join(", ")}
                          {quotation.items.length > 2 && ` +${quotation.items.length - 2} more`}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card className="mt-8 p-6 bg-primary/5 border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Need help with your orders?</h3>
              <p className="text-sm text-muted-foreground">
                Check out our quotation system or contact support
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
