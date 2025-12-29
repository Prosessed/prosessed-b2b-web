"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingCart, Loader2 } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  unit: string
  quantity: number
  note?: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "Organic Tomatoes",
      price: 12.99,
      image: "/ripe-tomatoes.png",
      unit: "kg",
      quantity: 5,
      note: "Please ensure they are fresh",
    },
    {
      id: "2",
      name: "Fresh Avocados",
      price: 18.99,
      image: "/ripe-avocados.png",
      unit: "box",
      quantity: 2,
    },
    {
      id: "3",
      name: "Premium Coffee Beans",
      price: 34.99,
      image: "/pile-of-coffee-beans.png",
      unit: "case",
      quantity: 3,
      note: "Dark roast preferred",
    },
  ])
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const updateQuantity = useCallback(
    async (id: string, newQuantity: number) => {
      if (newQuantity < 1) return
      setIsUpdating(id)

      // Optimistic update
      setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))

      try {
        // Simulation for API latency
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        // Rollback would happen here with real API
        console.error("[v0] Cart update failed", error)
      } finally {
        setIsUpdating(null)
      }
    },
    [cartItems],
  )

  const updateNote = (id: string, note: string) => {
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, note } : item)))
  }

  const removeItem = async (id: string) => {
    // Optimistic removal with exit animation
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-foreground hover:bg-accent hover:text-foreground">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8 tracking-tight">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="p-12 text-center border-dashed border-2">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10" />
            </div>
            <p className="text-muted-foreground font-medium">Your cart is feeling a bit light...</p>
            <Button className="bg-primary text-primary-foreground font-bold h-11 px-8" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="p-6 overflow-hidden border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Image */}
                  <div className="relative w-full sm:w-28 aspect-square shrink-0 rounded-xl overflow-hidden bg-muted/40">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-contain p-2" />
                    {isUpdating === item.id && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <Link
                          href={`/products/${item.id}`}
                          className="font-bold text-lg hover:text-primary transition-colors leading-tight"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          <span>{item.unit}</span>
                          <span>•</span>
                          <span>${item.price.toFixed(2)} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-4">
                      <div className="flex items-center gap-1 bg-primary/5 rounded-xl border border-primary/20 p-1">
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          variant="ghost"
                          size="icon"
                          disabled={isUpdating === item.id || item.quantity <= 1}
                          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-10 text-center font-bold text-sm tabular-nums">{item.quantity}</div>
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          variant="ghost"
                          size="icon"
                          disabled={isUpdating === item.id}
                          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    {/* Item Note */}
                    <div className="relative group">
                      <Textarea
                        placeholder="Add special instructions (e.g. 'extra ripe', 'substitute if unavailable')..."
                        value={item.note || ""}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        className="min-h-[50px] text-sm bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl resize-none"
                      />
                      <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                        Auto-saving...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="p-8 sticky top-24 border-2 border-primary/10 shadow-xl shadow-primary/5 rounded-2xl">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Button
                  size="lg"
                  className="w-full text-base h-12 mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-base h-12 bg-transparent border-border text-foreground hover:bg-accent hover:text-foreground"
                >
                  Save for Later
                </Button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t space-y-3 text-sm text-muted-foreground">
                <p>Free shipping on orders over $500</p>
                <p>Estimated delivery: 2-3 business days</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
