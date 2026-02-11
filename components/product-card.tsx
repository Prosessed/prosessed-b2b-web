"use client"
import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { useAuth } from "@/lib/auth/context"
import { getApiBaseUrl } from "@/lib/api/client"
import { formatPrice } from "@/lib/utils/currency"
import { getDisplayImageUrl } from "@/lib/utils/image-url"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  unit?: string
  stock?: number
  rate?: number
  customerPriceMargin?: {
    price_margin: number
    is_custom_price: number
  }
  tag?: "hot-deal" | "best-seller" | "new" | "limited"
  discount?: number
}

export function ProductCard({ id, name, price, image, unit = "kg", stock, rate, customerPriceMargin, tag, discount }: ProductCardProps) {
  const { cart, addItem, updateItem, removeItem, isLoading: cartLoading } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { user } = useAuth()
  const [isMutating, setIsMutating] = useState(false)

  const cartItem = cart?.items?.find((item) => item.item_code === id)
  const quantity = cartItem?.qty || 0
  const [inputVal, setInputVal] = useState(String(quantity))
  useEffect(() => {
    setInputVal(String(quantity))
  }, [quantity])

  // First-time add: add 1 quantity, then stepper (- [box] +) appears
  const handleAddOne = useCallback(async () => {
    if (!user) return
    const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
    if (!itemRate || itemRate <= 0) return
    setIsMutating(true)
    try {
      await addItem({
        item_code: id,
        qty: 1,
        rate: itemRate,
        warehouse: user.defaultWarehouse,
        uom: unit,
      })
      await new Promise((r) => setTimeout(r, 100))
      openDrawer()
    } catch (e) {
      console.error("Failed to add item:", e)
    } finally {
      setIsMutating(false)
    }
  }, [id, price, rate, unit, user, addItem, openDrawer])

  const increment = useCallback(async () => {
    if (!user || !cartItem) return
    setIsMutating(true)
    try {
      await updateItem(cartItem.name, { qty: quantity + 1 })
    } catch (error) {
      console.error("Failed to update item:", error)
    } finally {
      setIsMutating(false)
    }
  }, [cartItem, quantity, updateItem, user])

  const decrement = useCallback(async () => {
    if (!cartItem) return
    setIsMutating(true)
    try {
      if (quantity <= 1) {
        await removeItem(cartItem.name)
      } else {
        await updateItem(cartItem.name, { qty: quantity - 1 })
      }
    } catch (error) {
      console.error("Failed to update item:", error)
    } finally {
      setIsMutating(false)
    }
  }, [cartItem, quantity, updateItem, removeItem])

  const applyQtyInput = useCallback(
    async (val: string) => {
      const n = Math.max(0, Math.floor(parseFloat(val) || 0))
      setInputVal(String(n))
      if (!user || n === 0) {
        if (cartItem) await removeItem(cartItem.name)
        return
      }
      const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
      if (cartItem) {
        await updateItem(cartItem.name, { qty: n })
      } else if (itemRate > 0) {
        await addItem({
          item_code: id,
          qty: n,
          rate: itemRate,
          warehouse: user.defaultWarehouse,
          uom: unit,
        })
      }
    },
    [user, cartItem, id, rate, price, unit, addItem, updateItem, removeItem]
  )

  const handleQtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5)
    setInputVal(v)
  }

  const handleQtyInputBlur = () => {
    const val = inputVal.trim()
    if (val === "" || val === String(quantity)) {
      setInputVal(String(quantity))
      return
    }
    setIsMutating(true)
    applyQtyInput(val).finally(() => setIsMutating(false))
  }

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const n = Math.max(0, Math.floor(parseFloat(inputVal) || 0) + 1)
      setInputVal(String(n))
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const n = Math.max(0, Math.floor(parseFloat(inputVal) || 0) - 1)
      setInputVal(String(n))
      return
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group relative">
        {tag && (
          <div className="absolute top-2 right-2 z-10">
            {tag === "hot-deal" && (
              <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                🔥 Hot Deal
              </div>
            )}
            {tag === "best-seller" && (
              <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                ⭐ Best Seller
              </div>
            )}
            {tag === "new" && (
              <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                ✨ New
              </div>
            )}
            {tag === "limited" && (
              <div className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                ⏰ Limited
              </div>
            )}
          </div>
        )}
        {discount && discount > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
            -{discount}%
          </div>
        )}
        <Link href={`/products/${id}`}>
          <div className="relative aspect-square bg-muted/30 group-hover:bg-muted/50 transition-colors overflow-hidden">
            <Image
              src={getDisplayImageUrl(image, getApiBaseUrl()) || "/placeholder.svg"}
              alt={name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
        <CardContent className="p-4">
          <Link href={`/products/${id}`} className="hover:text-primary">
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{name}</h3>
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              {customerPriceMargin?.is_custom_price === 1 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custom Pricing</p>
                  <p className="text-xs text-muted-foreground">Contact for quote</p>
                </div>
              ) : customerPriceMargin?.is_custom_price === 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price on Request</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold text-foreground">{formatPrice(price ?? 0, user?.defaultCurrency)}</p>
                  <p className="text-xs text-muted-foreground">per {unit}</p>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.div
                  key="add-btn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center"
                >
                  <Button
                    onClick={handleAddOne}
                    disabled={isMutating}
                    size="sm"
                    className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm active:scale-95 transition-all rounded-lg"
                  >
                    {isMutating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "ADD"
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="qty-stepper"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center gap-0 border rounded-lg border-primary bg-primary/5 shadow-inner overflow-hidden"
                >
                  <Button
                    onClick={decrement}
                    variant="ghost"
                    size="icon"
                    disabled={isMutating}
                    className="h-9 w-9 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-l-lg rounded-r-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="relative flex items-center justify-center min-w-[3rem] h-9">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={inputVal}
                      onChange={handleQtyInputChange}
                      onBlur={handleQtyInputBlur}
                      onFocus={() => setInputVal(String(quantity))}
                      onKeyDown={handleQtyKeyDown}
                      disabled={isMutating}
                      className="h-9 w-12 text-center text-sm font-bold p-1 border-0 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70"
                    />
                    {isMutating && (
                      <span className="absolute pointer-events-none flex items-center justify-center inset-0 bg-primary/5">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={increment}
                    variant="ghost"
                    size="icon"
                    disabled={isMutating}
                    className="h-9 w-9 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-r-lg rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
