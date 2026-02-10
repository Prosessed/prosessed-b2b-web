"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSalesPersonOrders } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth/context"
import { formatPrice, formatDate } from "@/lib/utils/currency"
import { ArrowRight, Package } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const { data, isLoading, error } = useSalesPersonOrders(1, 50)
  const orders = data?.sales_orders ?? []

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

  const getStatusBadge = (workflowState: string) => {
    const s = (workflowState || "").toLowerCase()
    if (s.includes("review") || s.includes("draft")) return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">{workflowState || "Pending"}</Badge>
    if (s.includes("submit") || s.includes("confirm")) return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">{workflowState}</Badge>
    if (s.includes("cancel")) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">{workflowState}</Badge>
    return <Badge className="bg-muted text-muted-foreground">{workflowState || "—"}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">View your sales orders</p>
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
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Your sales orders will appear here</p>
            <Button asChild>
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: any) => (
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
                    {getStatusBadge(order.workflow_state)}
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
                  <div className="flex justify-end pt-4 border-t">
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
              <h3 className="font-semibold mb-1">Need help?</h3>
              <p className="text-sm text-muted-foreground">Contact support for order queries</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
