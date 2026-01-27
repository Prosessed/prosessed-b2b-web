"use client"
import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { useItemDetails } from "@/lib/api/hooks"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { useAuth } from "@/lib/auth/context"
import { motion } from "framer-motion"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemCode = params.id as string
  const [selectedUom, setSelectedUom] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const { user } = useAuth()
  const { addItem } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { data, isLoading, error } = useItemDetails(itemCode, quantity)

  const product = data

  // Debug logging
  useEffect(() => {
    if (product && process.env.NODE_ENV === "development") {
      console.log("[Product Detail] Product data:", {
        item_code: product.item_code,
        item_name: product.item_name,
        rate: product.rate,
        price_list_rate: product.price_list_rate,
        uoms: product.uoms?.length || 0,
      })
    }
  }, [product])

  // Reset state when itemCode changes
  useEffect(() => {
    setSelectedUom(null)
    setQuantity(1)
    setNote("")
    // SWR will automatically refetch when itemCode changes due to key change
  }, [itemCode])

  // Set default UOM when data loads
  useEffect(() => {
    if (product?.uom && !selectedUom) {
      setSelectedUom(product.uom)
    }
  }, [product?.uom, selectedUom])

  const currentUom = useMemo(() => {
    if (!product?.uoms || !Array.isArray(product.uoms) || product.uoms.length === 0) return null
    if (selectedUom) {
      return product.uoms.find((u: any) => u.uom === selectedUom) || product.uoms[0]
    }
    return product.uoms[0]
  }, [product?.uoms, selectedUom])

  const currentRate = useMemo(() => {
    if (currentUom?.price_list_rate) return currentUom.price_list_rate
    if (product?.price_list_rate) return product.price_list_rate
    if (product?.rate) return product.rate
    return 0
  }, [currentUom, product])

  const totalPrice = currentRate * quantity

  const increment = () => setQuantity((prev) => prev + 1)
  const decrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = async () => {
    if (!user || !product) return
    
    // Ensure we have a valid rate before adding to cart
    if (!currentRate || currentRate <= 0) {
      console.error(`Cannot add item ${product.item_code}: Invalid rate (${currentRate})`)
      return
    }
    
    setIsAdding(true)
    try {
      await addItem({
        item_code: product.item_code,
        qty: quantity,
        rate: currentRate,
        warehouse: user.defaultWarehouse,
        uom: selectedUom || product.uom || product.stock_uom,
        custom_quotation_item_details: note || undefined,
      })
      // Small delay for smooth UI update
      await new Promise((resolve) => setTimeout(resolve, 200))
      // Open cart drawer instead of redirecting
      openDrawer()
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card className="overflow-hidden rounded-2xl border-2 border-primary/10">
            <div className="relative aspect-square bg-muted/30">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.item_name || "Product image"}
                fill
                className="object-contain p-8"
                priority
              />
            </div>
          </Card>
          {product.tags && (
            <div className="flex flex-wrap gap-2">
              {product.tags.split(",").map((tag: string) => (
                <Badge key={tag.trim()} variant="secondary" className="rounded-full">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.item_group && (
                <Badge variant="outline" className="text-xs">
                  {product.item_group}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="text-xs">
                  {product.brand}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tight">{product.item_name}</h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>


          {/* Price */}
          <Card className="p-6 bg-primary/5 border-primary/20 rounded-xl">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-primary">${currentRate.toFixed(2)}</span>
              <span className="text-muted-foreground">per {selectedUom || product.uom || product.stock_uom}</span>
            </div>
          </Card>

          {/* UOM Selector */}
          {product.uoms && product.uoms.length > 1 && (
            <div className="space-y-3">
              <Label className="text-base font-bold">Select Unit of Measurement</Label>
              <RadioGroup
                value={selectedUom || product.uom}
                onValueChange={setSelectedUom}
                className="space-y-2"
              >
                {product.uoms.map((uom: any) => (
                  <motion.div
                    key={uom.uom}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <RadioGroupItem value={uom.uom} id={uom.uom} />
                    <Label htmlFor={uom.uom} className="flex-1 cursor-pointer flex justify-between items-center">
                      <div>
                        <span className="font-bold">{uom.uom}</span>
                        {uom.conversion_factor !== 1 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Conversion: {uom.conversion_factor}x)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${uom.price_list_rate.toFixed(2)}</div>
                      </div>
                    </Label>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <Label className="text-base font-bold">Quantity</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-2 rounded-xl overflow-hidden">
                <Button
                  onClick={decrement}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-20 text-center text-lg font-bold bg-transparent border-none focus:outline-none"
                  min="1"
                />
                <Button
                  onClick={increment}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-lg">
                Total: <span className="font-black text-primary text-xl">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-3">
            <Label htmlFor="note" className="text-base font-bold">
              Add Note (Optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Special instructions, delivery preferences, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
          </div>

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className="w-full text-lg h-14 rounded-xl font-bold"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </span>
            ) : (
              `Add to Cart - $${totalPrice.toFixed(2)}`
            )}
          </Button>

          {/* Product Info */}
          <Card className="p-6 bg-muted/30 rounded-xl">
            <div className="space-y-3 text-sm">
              {product.item_group && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-bold">{product.item_group}</span>
                </div>
              )}
              {product.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-bold">{product.brand}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Pricing Rules */}
          {product.pricing_rule_details && product.pricing_rule_details.length > 0 && (
            <Card className="p-6 bg-primary/5 border-primary/20 rounded-xl">
              <h3 className="font-bold mb-3">Special Offers</h3>
              <div className="space-y-2">
                {product.pricing_rule_details.map((rule: any, idx: number) => (
                  <div key={idx} className="p-3 bg-background rounded-lg">
                    {rule.custom_offer_text && (
                      <p className="font-semibold text-primary">{rule.custom_offer_text}</p>
                    )}
                    {rule.custom_pricing_rule_description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.custom_pricing_rule_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

        </motion.div>
      </div>
    </div>
  )
}
