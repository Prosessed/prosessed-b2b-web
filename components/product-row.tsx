"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ChevronRight } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  unit?: string
  deliveryTime?: string
}

interface ProductRowProps {
  title: string
  products: Product[]
  categoryHref?: string
}

export function ProductRow({ title, products, categoryHref = "/products" }: ProductRowProps) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button variant="ghost" asChild className="text-primary hover:text-primary/90">
          <Link href={categoryHref} className="flex items-center gap-1">
            see all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map((product) => (
          <ProductRowCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  )
}

function ProductRowCard({ id, name, price, originalPrice, image, unit = "kg", deliveryTime }: Product) {
  const [quantity, setQuantity] = useState(0)

  const handleAdd = () => setQuantity(1)
  const increment = () => setQuantity((prev) => prev + 1)
  const decrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1)
    else setQuantity(0)
  }

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50">
      <Link href={`/products/${id}`}>
        <div className="relative aspect-square bg-muted">
          <Image src={image || "/placeholder.svg"} alt={name} fill className="object-contain p-2" />
          {deliveryTime && (
            <Badge className="absolute top-2 left-2 text-xs bg-muted/90 text-foreground border-0">{deliveryTime}</Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 text-xs bg-primary text-primary-foreground">{discount}% OFF</Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <Link href={`/products/${id}`} className="hover:text-primary transition-colors">
          <h3 className="font-medium text-sm mb-1 line-clamp-2 min-h-[2.5rem]">{name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-2">{unit}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold">${price.toFixed(2)}</p>
            {originalPrice && <p className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(2)}</p>}
          </div>
          {quantity === 0 ? (
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-1 border rounded-md border-primary">
              <Button onClick={decrement} variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-semibold w-6 text-center text-sm">{quantity}</span>
              <Button onClick={increment} variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
