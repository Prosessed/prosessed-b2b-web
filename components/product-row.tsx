"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ChevronRight } from "lucide-react"
import { useItems } from "@/lib/api/hooks"
import { SkeletonProductRow } from "./skeleton-card"
import { motion } from "framer-motion"

interface ProductRowProps {
  title: string
  itemGroup: string // added itemGroup for API fetching
  categoryHref?: string
}

export function ProductRow({ title, itemGroup, categoryHref = "/products" }: ProductRowProps) {
  const { data, isLoading } = useItems({ item_group: itemGroup, page_size: 6 })

  if (isLoading) return <SkeletonProductRow />

  const products = data?.message?.items || []

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Button variant="ghost" asChild className="text-primary hover:text-primary/90 font-semibold">
          <Link href={categoryHref} className="flex items-center gap-1">
            see all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
      >
        {products.map((product: any) => (
          <ProductRowCard
            key={product.item_code}
            id={product.item_code}
            name={product.item_name}
            price={product.rate}
            originalPrice={product.price_list_rate > product.rate ? product.price_list_rate : undefined}
            image={product.image}
            unit={product.stock_uom}
            deliveryTime="8 MINS"
          />
        ))}
      </motion.div>
    </section>
  )
}

function ProductRowCard({ id, name, price, originalPrice, image, unit = "kg", deliveryTime }: any) {
  const [quantity, setQuantity] = useState(0)
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    await new Promise((r) => setTimeout(r, 400)) // simulation for smooth UX
    setQuantity(1)
    setIsAdding(false)
  }

  const increment = () => setQuantity((prev) => prev + 1)
  const decrement = () => setQuantity((prev) => Math.max(0, prev - 1))

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 group flex flex-col">
      <Link href={`/products/${id}`} className="block relative aspect-square bg-muted/30 overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
        />
        {deliveryTime && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 backdrop-blur shadow-sm flex items-center gap-1">
            <span className="text-[10px] font-bold text-primary">⚡</span>
            <span className="text-[10px] font-bold uppercase">{deliveryTime}</span>
          </div>
        )}
        {discount > 0 && (
          <Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground font-bold border-0">
            {discount}% OFF
          </Badge>
        )}
      </Link>
      <CardContent className="p-3 flex-1 flex flex-col">
        <Link href={`/products/${id}`} className="hover:text-primary transition-colors flex-1">
          <h3 className="font-medium text-sm mb-1 line-clamp-2 leading-snug">{name}</h3>
        </Link>
        <p className="text-[11px] text-muted-foreground mb-3 font-medium uppercase tracking-wider">{unit}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through decoration-destructive/50">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="relative h-9 w-20 flex items-center justify-center">
            {quantity === 0 ? (
              <Button
                onClick={handleAdd}
                disabled={isAdding}
                size="sm"
                className="w-full h-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold border-0 shadow-sm active:scale-95 transition-all"
              >
                {isAdding ? (
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                ) : (
                  "ADD"
                )}
              </Button>
            ) : (
              <div className="flex items-center w-full h-8 bg-primary/10 rounded-md border border-primary/20 overflow-hidden">
                <button
                  onClick={decrement}
                  className="flex-1 h-full flex items-center justify-center hover:bg-primary/20 transition-colors text-primary"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-primary">{quantity}</span>
                <button
                  onClick={increment}
                  className="flex-1 h-full flex items-center justify-center hover:bg-primary/20 transition-colors text-primary"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
