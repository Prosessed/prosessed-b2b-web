"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus } from "lucide-react"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  unit?: string
}

export function ProductCard({ id, name, price, image, unit = "kg" }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0)

  const handleAdd = () => {
    setQuantity(1)
  }

  const increment = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    } else {
      setQuantity(0)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
      <Link href={`/products/${id}`}>
        <div className="relative aspect-square">
          <Image src={image || "/placeholder.svg"} alt={name} fill className="object-contain p-2" />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${id}`} className="hover:text-primary">
          <h3 className="font-medium text-sm mb-1 line-clamp-2">{name}</h3>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-lg font-bold">${price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per {unit}</p>
          </div>
          {quantity === 0 ? (
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2 border rounded-md border-primary">
              <Button onClick={decrement} variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button onClick={increment} variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
