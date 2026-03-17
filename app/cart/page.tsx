"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { CartItemResponse } from "@/lib/api/cart"
import { useCartContext } from "@/lib/cart/context"
import { useAuth } from "@/lib/auth/context"
import { getApiBaseUrl } from "@/lib/api/client"
import { formatPrice } from "@/lib/utils/currency"
import { getDisplayImageUrl, getFirstImageUrl } from "@/lib/utils/image-url"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const currency = user?.defaultCurrency ?? "AUD"
  const {
    cart,
    isLoading,
    setUseFullCart,
    updateItem,
    removeItem,
    submitQuotation,
    clearCart,
    updateCart,
  } = useCartContext()

  useEffect(() => {
    setUseFullCart(true)
    return () => setUseFullCart(false)
  }, [setUseFullCart])

  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [orderNote, setOrderNote] = useState("")
  const [isSavingOrderNote, setIsSavingOrderNote] = useState(false)

  const cartItems: CartItemResponse[] = cart?.items || []

  const subtotal = cartItems.reduce((sum, item) => sum + item.amount, 0)
  const totalTaxesAndCharges = cart?.total_taxes_and_charges || 0

  const groupedCartItems = useMemo(() => {
    if (!cartItems.length) {
      return []
    }

    const groups = cartItems.reduce<Record<string, CartItemResponse[]>>((acc, item) => {
      const groupKey = item.item_group || "Other"
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(item)
      return acc
    }, {})

    return Object.entries(groups).map(([groupName, items]) => ({
      groupName,
      items,
    }))
  }, [cartItems])

  useEffect(() => {
    if (!groupedCartItems.length) return
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      groupedCartItems.forEach((g) => next.add(g.groupName))
      return next
    })
  }, [groupedCartItems])

  useEffect(() => {
    if (!cart) return
    setOrderNote(cart.custom_quotation_detail_notes ?? "")
  }, [cart])

  const isGroupExpanded = useCallback(
    (groupName: string) => expandedGroups.has(groupName),
    [expandedGroups]
  )

  const handleToggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) next.delete(groupName)
      else next.add(groupName)
      return next
    })
  }, [])

  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      if (newQuantity < 1) return
      setIsUpdating(itemId)
      try {
        await updateItem(itemId, { qty: newQuantity })
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
      } finally {
        setIsUpdating(null)
      }
    },
    [removeItem]
  )

  const handleSubmitQuotation = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await submitQuotation()
      setSubmitSuccess(true)
      // Brief success feedback then redirect to My Quotes
      await new Promise((resolve) => setTimeout(resolve, 800))
      router.push("/quotes")
    } catch (error) {
      console.error("Failed to submit quotation:", error)
      setIsSubmitting(false)
    }
  }, [submitQuotation, router])

  const handleClearCart = useCallback(async () => {
    if (isClearing || !cartItems.length) return
    if (!confirm("Are you sure you want to clear your cart?")) return

    setIsClearing(true)
    try {
      await Promise.all(
        cartItems.map((item) => removeItem(item.name))
      )
      clearCart()
    } finally {
      setIsClearing(false)
    }
  }, [cartItems, removeItem, clearCart, isClearing])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="p-12 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>

        {/* {cartItems.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearCart}
            disabled={isClearing}
            className="text-destructive bg-transparent"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Clear Cart
              </>
            )}
          </Button>
        )} */}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* ITEMS */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {groupedCartItems.map((group) => {
              const isExpanded = isGroupExpanded(group.groupName)
              return (
              <motion.div
                key={group.groupName}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <button
                  type="button"
                  onClick={() => handleToggleGroup(group.groupName)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 -my-1 text-left hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer border-0 bg-transparent"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.groupName}`}
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5 border border-border/60">
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span className="text-base font-bold tracking-tight">
                      {group.groupName}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm font-medium">
                      {group.items.length} {group.items.length === 1 ? "item" : "items"}
                    </span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.span>
                  </span>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                {group.items.map((item) => (
                  <motion.div
                    key={item.name}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-6">
                      <div className="flex gap-6">
                        <div className="relative w-28 h-28 bg-muted rounded-xl overflow-hidden">
                          <Image
                            src={
                              getDisplayImageUrl(getFirstImageUrl(item.image), getApiBaseUrl()) ||
                              "/placeholder.svg"
                            }
                            alt={item.item_name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between">
                            <div>
                              <Link
                                href={`/products/${item.item_code}`}
                                className="font-bold text-lg hover:text-primary"
                              >
                                {item.item_name}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {item.uom} • {formatPrice(item.rate ?? 0, currency)}
                              </p>
                            </div>
                            <p className="font-bold text-primary text-lg">
                              {formatPrice(item.amount ?? 0, currency)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={isUpdating === item.name || item.qty <= 1}
                                onClick={() => updateQuantity(item.name, item.qty - 1)}
                                className="cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-10 text-center font-bold">
                                {item.qty}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={isUpdating === item.name}
                                onClick={() => updateQuantity(item.name, item.qty + 1)}
                                className="cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              className="text-destructive cursor-pointer"
                              disabled={isUpdating === item.name}
                              onClick={() => handleRemoveItem(item.name)}
                              aria-label={`Remove ${item.item_name} from cart`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>

                          <Textarea
                            placeholder="Add special instructions..."
                            value={
                              itemNotes[item.name] ??
                              (item.custom_quotation_item_details ?? "")
                            }
                            onChange={(e) =>
                              setItemNotes((p) => ({
                                ...p,
                                [item.name]: e.target.value,
                              }))
                            }
                            onBlur={async () => {
                              const note = itemNotes[item.name]
                              if (note !== item.custom_quotation_item_details) {
                                await updateItem(item.name, {
                                  custom_quotation_item_details: note,
                                })
                              }
                            }}
                            className="min-h-[50px]"
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                </motion.div>
              </motion.div>
            )
            })}
          </AnimatePresence>
        </div>

        {/* SUMMARY */}
        <div>
          <Card className="p-8 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="mb-6 space-y-2">
              <label
                htmlFor="order-note"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
              >
                Order note
              </label>
              <Textarea
                id="order-note"
                placeholder="Add a note for this order (optional)"
                value={orderNote}
                onChange={(event) => setOrderNote(event.target.value)}
                onBlur={async () => {
                  try {
                    setIsSavingOrderNote(true)
                    await updateCart({ custom_quotation_detail_notes: orderNote || "" })
                  } finally {
                    setIsSavingOrderNote(false)
                  }
                }}
                className="min-h-[72px] text-sm"
              />
              {isSavingOrderNote && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving note…
                </p>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>

              {totalTaxesAndCharges > 0 && (
                <div className="flex justify-between">
                  <span>Taxes &amp; charges</span>
                  <span>{formatPrice(totalTaxesAndCharges, currency)}</span>
                </div>
              )}

              
              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(cart.grand_total ?? 0, currency)}
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center gap-2 p-4 bg-primary/10 rounded-xl text-primary"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Quotation Submitted
                </motion.div>
              ) : (
                <Button
                  size="lg"
                  className="w-full mt-6"
                  disabled={isSubmitting}
                  onClick={handleSubmitQuotation}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Quotation"
                  )}
                </Button>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  )
}
