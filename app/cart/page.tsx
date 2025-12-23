"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react"

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

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const updateNote = (id: string, note: string) => {
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, note } : item)))
  }

  const removeItem = (id: string) => {
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

      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link
                          href={`/products/${item.id}`}
                          className="font-medium hover:text-primary inline-block mb-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">Unit: {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border rounded-lg border-border">
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                          className="w-16 text-center border-none h-9 focus-visible:ring-0"
                        />
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    {/* Item Note */}
                    <div>
                      <Textarea
                        placeholder="Add note for this item..."
                        value={item.note || ""}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
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
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
