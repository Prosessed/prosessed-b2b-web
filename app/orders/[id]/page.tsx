import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { OrderModel } from "@/lib/models/order"
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from "lucide-react"
import { notFound } from "next/navigation"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await OrderModel.getById(id)

  if (!order) {
    notFound()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-5 w-5" />
      case "shipped":
        return <Truck className="h-5 w-5" />
      case "processing":
        return <Package className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "shipped":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "processing":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
                  <p className="text-muted-foreground">
                    Placed on{" "}
                    {new Date(order.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge className={`${getStatusColor(order.status)} flex items-center gap-2 px-4 py-2`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize font-semibold">{order.status}</span>
                </Badge>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Order Items</h3>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="relative h-20 w-20 rounded overflow-hidden bg-muted flex-shrink-0">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} {item.uom}
                      </p>
                      <p className="text-sm text-muted-foreground">Unit Price: ${item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${(order.total / 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (10%)</span>
                  <span>${(order.total - order.total / 1.1).toFixed(2)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
              <Link href="/products">Reorder Items</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
