"use client"
import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus, ChevronRight } from "lucide-react"
import { useItems, useMostBoughtItems } from "@/lib/api/hooks"
import { useCartContext } from "@/lib/cart/context"
import { useAuth } from "@/lib/auth/context"
import { SkeletonProductRow } from "./skeleton-card"
import { motion } from "framer-motion"

interface ProductRowProps {
  title: string
  itemGroup: string
  categoryHref?: string
  pageSize?: number
}

export function ProductRow({ title, itemGroup, categoryHref = "/products", pageSize = 6 }: ProductRowProps) {
  const isPreviouslyBought = title === "Previously Bought Items" || categoryHref.includes("previously_bought")
  
  const { data: itemsData, isLoading: itemsLoading } = useItems({ 
    item_group: !isPreviouslyBought && itemGroup ? itemGroup : undefined, 
    page_size: !isPreviouslyBought ? pageSize : undefined
  })
  
  const { data: mostBoughtData, isLoading: mostBoughtLoading } = useMostBoughtItems(
    isPreviouslyBought ? {
      page_size: pageSize,
      time_frame: "6 months",
    } : undefined
  )

  const isLoading = isPreviouslyBought ? mostBoughtLoading : itemsLoading
  const products = isPreviouslyBought 
    ? (mostBoughtData?.message?.items || mostBoughtData?.items || []) 
    : (itemsData?.message?.items || [])

  if (isPreviouslyBought && process.env.NODE_ENV === "development") {
    console.log(`[ProductRow] Previously Bought - Loading: ${mostBoughtLoading}, Items: ${products.length}`, {
      hasMessage: !!mostBoughtData?.message,
      messageItems: mostBoughtData?.message?.items?.length || 0,
      directItems: mostBoughtData?.items?.length || 0,
      data: mostBoughtData
    })
  }

  if (isLoading) return <SkeletonProductRow />
  
  if (isPreviouslyBought && products.length === 0 && !isLoading) return null

  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        <Button variant="ghost" asChild className="text-primary hover:text-primary/90 font-bold text-sm">
          <Link href={categoryHref} className="flex items-center gap-1.5 hover:gap-2 transition-all">
            see all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={pageSize >= 10 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        }
      >
        {products.map((product: any) => {
          // Determine the display price and rate for cart
          const displayPrice = product.price_list_rate ?? product.rate ?? 0
          const cartRate = product.rate ?? product.price_list_rate ?? 0
          
          return (
            <ProductRowCard
              key={product.item_code}
              id={product.item_code}
              name={product.item_name}
              price={displayPrice}
              rate={cartRate}
              image={product.image}
              unit={product.stock_uom || product.uom}
            />
          )
        })}
      </motion.div>
    </section>
  )
}

function ProductRowCard({ id, name, price, rate, image, unit = "kg" }: any) {
  const { cart, addItem, updateItem, removeItem } = useCartContext()
  const { user } = useAuth()
  const [isAdding, setIsAdding] = useState(false)

  const cartItem = cart?.items?.find((item) => item.item_code === id)
  const quantity = cartItem?.qty || 0

  const handleAdd = useCallback(async () => {
    if (!user) return
    
    // Use rate if available, otherwise fall back to price (which already has fallback logic)
    const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
    
    if (!itemRate || itemRate <= 0) {
      console.error(`Cannot add item ${id}: Invalid rate. Rate: ${rate}, Price: ${price}`)
      return
    }
    
    setIsAdding(true)
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
    } catch (error) {
      console.error("Failed to add item:", error)
    } finally {
      setIsAdding(false)
    }
  }, [id, price, rate, unit, user, addItem])

  const increment = useCallback(async () => {
    if (!user || !cartItem) return
    try {
      await updateItem(cartItem.name, { qty: quantity + 1 })
    } catch (error) {
      console.error("Failed to update item:", error)
    }
  }, [cartItem, quantity, updateItem, user])

  const decrement = useCallback(async () => {
    if (!cartItem) return
    try {
      if (quantity <= 1) {
        await removeItem(cartItem.name)
      } else {
        await updateItem(cartItem.name, { qty: quantity - 1 })
      }
    } catch (error) {
      console.error("Failed to update item:", error)
    }
  }, [cartItem, quantity, updateItem, removeItem])

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-2 border-border/30 hover:border-primary/30 group flex flex-col rounded-2xl h-full bg-gradient-to-b from-card to-card/95">
        <Link href={`/products/${id}`} className="block relative aspect-square bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10" />
          <Image
            src={image || "/placeholder.svg"}
            alt={name || "Product image"}
            fill
            className="object-contain p-3 group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </Link>
        <CardContent className="p-4 flex-1 flex flex-col rounded-b-2xl bg-card">
          <Link href={`/products/${id}`} className="hover:text-primary transition-colors flex-1 mb-2 group/link">
            <h3 className="font-black text-sm mb-1.5 line-clamp-2 leading-tight group-hover/link:text-primary transition-colors">{name}</h3>
          </Link>
          <p className="text-[9px] text-muted-foreground mb-3 font-bold uppercase tracking-widest opacity-70">{unit}</p>
          <div className="flex items-end justify-between mt-auto gap-3">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xl font-black text-foreground leading-none">${(price || 0).toFixed(2)}</span>
            </div>

            <div className="relative h-10 w-24 flex items-center justify-center shrink-0">
              {quantity === 0 ? (
                <Button
                  onClick={handleAdd}
                  disabled={isAdding}
                  size="sm"
                  className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-sm border-0 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all rounded-xl px-4"
                >
                  {isAdding ? (
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  ) : (
                    "ADD"
                  )}
                </Button>
              ) : (
                <div className="flex items-center w-full h-10 bg-primary/10 rounded-xl border-2 border-primary/30 overflow-hidden shadow-sm">
                  <button
                    onClick={decrement}
                    className="flex-1 h-full flex items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors text-primary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-base font-black text-primary tabular-nums">{quantity}</span>
                  <button
                    onClick={increment}
                    className="flex-1 h-full flex items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
