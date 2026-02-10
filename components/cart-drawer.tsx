"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingCart, Loader2, X } from "lucide-react"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { useAuth } from "@/lib/auth/context"
import { formatPrice } from "@/lib/utils/currency"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet"

export function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawer()
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCartContext()
  const { user } = useAuth()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const currency = user?.defaultCurrency ?? "AUD"

  const cartItems = cart?.items || []
  const grandTotal = cart?.grand_total || 0

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

  const handleClearCart = useCallback(async () => {
    const items = cart?.items || []
    if (!cart || items.length === 0) return
    
    if (!confirm("Are you sure you want to clear all items from your cart?")) {
      return
    }
    
    setIsClearing(true)
    try {
      const removePromises = items.map((item) => removeItem(item.name))
      await Promise.all(removePromises)
      await new Promise((resolve) => setTimeout(resolve, 300))
      clearCart()
    } catch (error) {
      console.error("Failed to clear cart:", error)
    } finally {
      setIsClearing(false)
    }
  }, [cart, removeItem, clearCart])

  const handleCheckout = useCallback(() => {
    closeDrawer()
    router.push("/cart")
  }, [router, closeDrawer])

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-black">Your Cart</SheetTitle>
              <SheetDescription className="mt-1">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </SheetDescription>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                disabled={isClearing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isClearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </>
                )}
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <p className="text-muted-foreground font-medium mb-2">Your cart is empty</p>
              <Button
                variant="outline"
                onClick={closeDrawer}
                className="mt-4"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex gap-4 p-4 border rounded-xl hover:border-primary/20 transition-all"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted/40">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.item_name || "Product"}
                        fill
                        className="object-contain p-2"
                      />
                      {isUpdating === item.name && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.item_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.uom} • {formatPrice(item.rate ?? 0, currency)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-primary/5 rounded-lg border border-primary/20 p-1">
                          <Button
                            onClick={() => updateQuantity(item.name, item.qty - 1)}
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating === item.name || item.qty <= 1}
                            className="h-7 w-7 rounded-md text-primary hover:bg-primary/10"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-8 text-center font-bold text-xs tabular-nums">{item.qty}</div>
                          <Button
                            onClick={() => updateQuantity(item.name, item.qty + 1)}
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating === item.name}
                            className="h-7 w-7 rounded-md text-primary hover:bg-primary/10"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-base text-primary">{formatPrice(item.amount ?? 0, currency)}</p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.name)}
                        disabled={isUpdating === item.name}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Cart Summary Footer */}
        {cartItems.length > 0 && (
          <div className="border-t p-6 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                <span className="font-medium">
                  {formatPrice(cartItems.reduce((sum, item) => sum + (item.amount ?? 0), 0), currency)}
                </span>
              </div>

              {cart?.additional_discount_percentage && cart.additional_discount_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount ({cart.additional_discount_percentage}%)</span>
                  <span className="font-medium text-primary">
                    -{formatPrice((cartItems.reduce((sum, item) => sum + (item.amount ?? 0), 0) * cart.additional_discount_percentage) / 100, currency)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(grandTotal, currency)}</span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleCheckout}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold h-12"
            >
              Proceed to Checkout
            </Button>

            <Button
              variant="outline"
              onClick={closeDrawer}
              className="w-full rounded-xl"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
