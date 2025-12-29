"use client"
import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  unit?: string
  stock?: number
}

export function ProductCard({ id, name, price, image, unit = "kg", stock }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0)
  const [isMutating, setIsMutating] = useState(false)

  const handleUpdateQuantity = useCallback(
    async (newQty: number) => {
      const prevQty = quantity
      setQuantity(newQty) // Optimistic update
      setIsMutating(true)

      try {
        // API call would go here
        await new Promise((resolve) => setTimeout(resolve, 600)) // Simulation
        setIsMutating(false)
      } catch (error) {
        setQuantity(prevQty) // Rollback on failure
        setIsMutating(false)
        // Toast error here
      }
    },
    [quantity],
  )

  const handleAdd = () => handleUpdateQuantity(1)
  const increment = () => handleUpdateQuantity(quantity + 1)
  const decrement = () => handleUpdateQuantity(Math.max(0, quantity - 1))

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
              <p className="text-lg font-bold text-foreground">${price.toFixed(2)}</p>
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
