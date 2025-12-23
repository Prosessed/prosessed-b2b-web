"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, ArrowLeft } from "lucide-react"

// Mock product data
const productData = {
  id: "1",
  name: "Organic Tomatoes",
  price: 12.99,
  image: "/ripe-tomatoes.png",
  description:
    "Premium quality organic tomatoes, vine-ripened for exceptional flavor. Perfect for restaurants, catering, and food service businesses. Grown without pesticides or synthetic fertilizers.",
  category: "Fruits & Vegetables",
  brand: "FreshCo",
  units: [
    { id: "kg", label: "Kilogram (kg)", price: 12.99 },
    { id: "box", label: "Box (10kg)", price: 120.0 },
    { id: "case", label: "Case (25kg)", price: 280.0 },
  ],
}

export default function ProductDetailPage() {
  const [selectedUnit, setSelectedUnit] = useState(productData.units[0].id)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")

  const currentUnit = productData.units.find((u) => u.id === selectedUnit) || productData.units[0]
  const totalPrice = currentUnit.price * quantity

  const increment = () => setQuantity((prev) => prev + 1)
  const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = () => {
    console.log("Add to cart:", { productData, selectedUnit, quantity, note })
    // Cart logic will be implemented later
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <Image
                src={productData.image || "/placeholder.svg"}
                alt={productData.name}
                fill
                className="object-cover"
              />
            </div>
          </Card>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{productData.category}</p>
            <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
            <p className="text-muted-foreground">{productData.description}</p>
          </div>

          {/* Price */}
          <Card className="p-6 bg-muted/50">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${currentUnit.price.toFixed(2)}</span>
              <span className="text-muted-foreground">per {currentUnit.label.split("(")[0].trim()}</span>
            </div>
          </Card>

          {/* Unit Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Unit of Measurement</Label>
            <RadioGroup value={selectedUnit} onValueChange={setSelectedUnit} className="space-y-2">
              {productData.units.map((unit) => (
                <div key={unit.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                  <RadioGroupItem value={unit.id} id={unit.id} />
                  <Label htmlFor={unit.id} className="flex-1 cursor-pointer flex justify-between">
                    <span>{unit.label}</span>
                    <span className="font-medium">${unit.price.toFixed(2)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Quantity</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border rounded-lg">
                <Button onClick={decrement} variant="ghost" size="icon" className="h-12 w-12">
                  <Minus className="h-5 w-5" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-lg font-medium bg-transparent border-none focus:outline-none"
                />
                <Button onClick={increment} variant="ghost" size="icon" className="h-12 w-12">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-lg">
                Total: <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-3">
            <Label htmlFor="note" className="text-base font-medium">
              Add Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Special instructions, delivery preferences, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Add to Cart Button */}
          <Button size="lg" className="w-full text-lg h-14" onClick={handleAddToCart}>
            Add to Cart - ${totalPrice.toFixed(2)}
          </Button>

          {/* Product Info */}
          <Card className="p-4 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand:</span>
                <span className="font-medium">{productData.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{productData.category}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
