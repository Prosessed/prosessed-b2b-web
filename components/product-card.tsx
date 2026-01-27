"use client"
import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { useAuth } from "@/lib/auth/context"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  unit?: string
  stock?: number
  rate?: number
}

export function ProductCard({ id, name, price, image, unit = "kg", stock, rate }: ProductCardProps) {
  const { cart, addItem, updateItem, removeItem, isLoading: cartLoading } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { user } = useAuth()
  const [isMutating, setIsMutating] = useState(false)

  const cartItem = cart?.items?.find((item) => item.item_code === id)
  const quantity = cartItem?.qty || 0

  const handleAdd = useCallback(async () => {
    if (!user) return
    
    // Use rate if available, otherwise fall back to price (which already has fallback logic)
    // Prioritize rate as it's the actual API field, but use price as fallback
    const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
    
    if (!itemRate || itemRate <= 0) {
      console.error(`Cannot add item ${id}: Invalid rate. Rate: ${rate}, Price: ${price}`)
      return
    }
    
    setIsMutating(true)
    try {
      await addItem({
        item_code: id,
        qty: 1,
        rate: itemRate,
        warehouse: user.defaultWarehouse,
        uom: unit,
      })
      // Small delay to ensure UI updates smoothly
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Open cart drawer after adding item
      openDrawer()
    } catch (error) {
      console.error("Failed to add item:", error)
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group">
        <Link href={`/products/${id}`}>
          <div className="relative aspect-square bg-muted/30 group-hover:bg-muted/50 transition-colors overflow-hidden">
            <Image
              src={image || "/placeholder.svg"}
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
              <p className="text-lg font-bold text-foreground">${(price || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">per {unit}</p>
            </div>

            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.div
                  key="add-btn"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Button
                    onClick={handleAdd}
                    disabled={isMutating}
                    size="sm"
                    className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm active:scale-95 transition-all"
                  >
                    ADD
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="qty-stepper"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 border rounded-lg border-primary bg-primary/5 shadow-inner"
                >
                  <Button
                    onClick={decrement}
                    variant="ghost"
                    size="icon"
                    disabled={isMutating}
                    className="h-9 w-9 hover:bg-primary/10 text-primary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="w-8 text-center flex items-center justify-center">
                    {isMutating ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary/70" />
                    ) : (
                      <span className="font-bold text-primary text-sm">{quantity}</span>
                    )}
                  </div>

                  <Button
                    onClick={increment}
                    variant="ghost"
                    size="icon"
                    disabled={isMutating}
                    className="h-9 w-9 hover:bg-primary/10 text-primary transition-colors"
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
