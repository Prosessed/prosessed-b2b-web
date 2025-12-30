"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { Minus, Plus, Trash2, ArrowLeft, ShoppingCart, Loader2, CheckCircle2 } from "lucide-react"
import { useCartContext } from "@/lib/cart/context"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth/context"

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem, submitQuotation } = useCartContext()
  const { user } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})

  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) return
      setIsUpdating(itemId)
      try {
        await updateItem(itemId, { qty: newQuantity })
      } catch (error) {
        console.error("Failed to update quantity:", error)
      } finally {
        setIsUpdating(null)
      }
    },
    [updateItem]
  )

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      setIsUpdating(itemId)
      try {
        await removeItem(itemId)
      } catch (error) {
        console.error("Failed to remove item:", error)
      } finally {
        setIsUpdating(null)
      }
    },
    [removeItem]
  )

  const handleSubmitQuotation = useCallback(async () => {
    if (!cart) return
    setIsSubmitting(true)
    try {
      await submitQuotation()
      setSubmitSuccess(true)
      setTimeout(() => {
        router.push("/quotes")
      }, 2000)
    } catch (error) {
      console.error("Failed to submit quotation:", error)
      setIsSubmitting(false)
    }
  }, [cart, submitQuotation, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const cartItems = cart?.items || []
  const grandTotal = cart?.grand_total || 0

  return (
    <div className="container mx-auto px-4 py-8 bg-background/50 min-h-screen">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-foreground hover:bg-accent">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8 tracking-tight">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-12 text-center border-dashed border-2 rounded-2xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10" />
            </div>
            <p className="text-muted-foreground font-medium">Your cart is empty</p>
            <Button className="bg-primary text-primary-foreground font-bold h-11 px-8 rounded-xl" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-6 overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Product Image */}
                      <div className="relative w-full sm:w-28 aspect-square shrink-0 rounded-xl overflow-hidden bg-muted/40">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.item_name || "Product image"}
                          fill
                          className="object-contain p-2"
                        />
                        {isUpdating === item.name && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                          >
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </motion.div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <Link
                              href={`/products/${item.item_code}`}
                              className="font-bold text-lg hover:text-primary transition-colors leading-tight"
                            >
                              {item.item_name}
                            </Link>
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              <span>{item.uom}</span>
                              <span>•</span>
                              <span>${item.rate.toFixed(2)} each</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xl text-primary">${item.amount.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-4">
                          <div className="flex items-center gap-1 bg-primary/5 rounded-xl border border-primary/20 p-1">
                            <Button
                              onClick={() => updateQuantity(item.name, item.qty - 1)}
                              variant="ghost"
                              size="icon"
                              disabled={isUpdating === item.name || item.qty <= 1}
                              className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 transition-all"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="w-10 text-center font-bold text-sm tabular-nums">{item.qty}</div>
                            <Button
                              onClick={() => updateQuantity(item.name, item.qty + 1)}
                              variant="ghost"
                              size="icon"
                              disabled={isUpdating === item.name}
                              className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.name)}
                            disabled={isUpdating === item.name}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium transition-all"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>

                        {/* Item Note */}
                        <div className="relative group">
                          <Textarea
                            placeholder="Add special instructions..."
                            value={itemNotes[item.name] || ""}
                            onChange={(e) => setItemNotes((prev) => ({ ...prev, [item.name]: e.target.value }))}
                            className="min-h-[50px] text-sm bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-8 sticky top-24 border-2 border-primary/10 shadow-xl shadow-primary/5 rounded-2xl">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">
                    ${cartItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </span>
                </div>

                {cart?.additional_discount_percentage && cart.additional_discount_percentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({cart.additional_discount_percentage}%)</span>
                    <span className="font-medium text-primary">
                      -$
                      {(
                        (cartItems.reduce((sum, item) => sum + item.amount, 0) * cart.additional_discount_percentage) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>

                <AnimatePresence mode="wait">
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-xl text-primary font-semibold"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Quotation Submitted!</span>
                    </motion.div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleSubmitQuotation}
                      disabled={isSubmitting || cartItems.length === 0}
                      className="w-full text-base h-12 mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        "Submit Quotation"
                      )}
                    </Button>
                  )}
                </AnimatePresence>
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
