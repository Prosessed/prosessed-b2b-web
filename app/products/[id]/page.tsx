"use client"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
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
import { useWarehousesByCustomerBranch } from "@/lib/api/hooks"
import { getApiBaseUrl } from "@/lib/api/client"
import { formatPrice } from "@/lib/utils/currency"
import { getDisplayImageUrl, getFirstImageUrl } from "@/lib/utils/image-url"
import { parseTags } from "@/lib/utils/tags"
import { TagBadge } from "@/components/tag-badge"
import { getPriceDisplay } from "@/lib/utils/pricing"
import { findCartLineByItemCode } from "@/lib/cart/utils"
import type { CartItemResponse } from "@/lib/api/cart"
import { motion } from "framer-motion"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemCode = params.id as string
  const [selectedUom, setSelectedUom] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const skipCartSyncRef = useRef(false)
  const syncInFlightRef = useRef(false)
  const cartItemsRef = useRef<CartItemResponse[] | undefined>(undefined)

  const { user } = useAuth()
  const { addItem, cart, updateItem, removeItem, refreshCart } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""
  const { data, isLoading, error } = useItemDetails(itemCode, quantity)

  const product = data
  const matchItemCode = product?.item_code ?? itemCode

  cartItemsRef.current = cart?.items

  const resolveCartLine = useCallback((): CartItemResponse | null => {
    return findCartLineByItemCode(cartItemsRef.current, matchItemCode)
  }, [matchItemCode])

  const cartItem = useMemo(
    () => findCartLineByItemCode(cart?.items, matchItemCode),
    [cart?.items, matchItemCode]
  )

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
    skipCartSyncRef.current = false
  }, [itemCode])

  // Keep detail quantity in sync with cart (e.g. after edits elsewhere)
  useEffect(() => {
    if (skipCartSyncRef.current || !cartItem) return
    setQuantity(cartItem.qty)
    if (cartItem.custom_quotation_item_details) {
      setNote(cartItem.custom_quotation_item_details)
    }
  }, [cartItem?.name, cartItem?.qty, cartItem?.custom_quotation_item_details])

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

  const applyQuantityToCart = useCallback(
    async (targetQty: number, options?: { openDrawerOnFirstAdd?: boolean }) => {
      if (!user || !product || syncInFlightRef.current) return

      if (!currentRate || currentRate <= 0) {
        console.error(`Cannot sync item ${product.item_code}: Invalid rate (${currentRate})`)
        return
      }

      const qty = Math.max(0, Math.floor(targetQty))
      const uom = selectedUom || product.uom || product.stock_uom
      const notePayload = note.trim() ? { custom_quotation_item_details: note.trim() } : {}

      syncInFlightRef.current = true
      skipCartSyncRef.current = true
      setIsSyncing(true)
      try {
        const line = resolveCartLine()

        if (line) {
          if (qty < 1) {
            await removeItem(line.name)
            setQuantity(1)
            return
          }
          await updateItem(line.name, {
            qty,
            ...notePayload,
          })
          setQuantity(qty)
          await refreshCart()
          return
        }

        if (qty < 1) {
          setQuantity(1)
          return
        }

        const shouldAutoOpenCart = options?.openDrawerOnFirstAdd ?? (cart?.items?.length ?? 0) === 0
        await addItem({
          item_code: product.item_code,
          qty,
          rate: currentRate,
          warehouse: resolvedWarehouse,
          uom,
          ...notePayload,
        })
        setQuantity(qty)
        await refreshCart()
        if (shouldAutoOpenCart) {
          openDrawer()
        }
      } catch (error) {
        console.error("Failed to sync cart:", error)
      } finally {
        skipCartSyncRef.current = false
        syncInFlightRef.current = false
        setIsSyncing(false)
      }
    },
    [
      user,
      product,
      currentRate,
      selectedUom,
      note,
      cart?.items?.length,
      resolvedWarehouse,
      resolveCartLine,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      openDrawer,
    ]
  )

  const handleIncrement = () => {
    const next = quantity + 1
    setQuantity(next)
    if (resolveCartLine() || cartItem) {
      void applyQuantityToCart(next)
    }
  }

  const handleDecrement = () => {
    const line = resolveCartLine() ?? cartItem
    if (line && quantity <= 1) {
      void applyQuantityToCart(0)
      return
    }
    const next = Math.max(1, quantity - 1)
    setQuantity(next)
    if (line) {
      void applyQuantityToCart(next)
    }
  }

  const handleQuantityInputChange = (raw: string) => {
    const parsed = Math.max(1, Number.parseInt(raw, 10) || 1)
    setQuantity(parsed)
  }

  const handleQuantityCommit = () => {
    if (resolveCartLine() || cartItem) {
      void applyQuantityToCart(quantity)
    }
  }

  const handleAddToCart = () => {
    void applyQuantityToCart(quantity, { openDrawerOnFirstAdd: true })
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
                src={getDisplayImageUrl(getFirstImageUrl(product.image), getApiBaseUrl()) || "/placeholder.svg"}
                alt={product.item_name || "Product image"}
                fill
                className="object-contain p-8"
                priority
              />
            </div>
          </Card>
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
                <Link
                  href={`/products?category=${encodeURIComponent(product.item_group)}`}
                  className="inline-flex"
                  aria-label={`View more products in ${product.item_group}`}
                >
                  <Badge
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {product.item_group}
                  </Badge>
                </Link>
              )}
              {product.brand && (
                <Badge variant="outline" className="text-xs">
                  {product.brand}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tight">{product.item_name}</h1>
            {parseTags(product.tags).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3" aria-label="Product tags">
                {parseTags(product.tags).map((tagLabel) => (
                  <TagBadge key={tagLabel} tag={tagLabel} variant="chip" />
                ))}
              </div>
            )}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>


          {/* Price */}
          <Card className="p-6 bg-primary/5 rounded-2xl border-primary/20">
            {(() => {
              const display = getPriceDisplay({
                basePrice: Number(currentRate ?? 0),
                currency: user?.defaultCurrency,
                marginInfo: product.customer_price_margin,
              })
              const perUnit = selectedUom || product.uom || product.stock_uom || ""

              if (display.kind === "hidden") {
                return (
                  <div>
                    <p className="text-sm text-muted-foreground">Pricing available on request. Please contact us for a quote.</p>
                  </div>
                )
              }

              if (display.kind === "range") {
                return (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {display.minLabel} - {display.maxLabel}
                    </span>
                    {perUnit ? <span className="text-muted-foreground">per {perUnit}</span> : null}
                  </div>
                )
              }

              return (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-primary">{display.label}</span>
                  {perUnit ? <span className="text-muted-foreground">per {perUnit}</span> : null}
                </div>
              )
            })()}
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
                        {(() => {
                          const display = getPriceDisplay({
                            basePrice: Number(uom.price_list_rate ?? 0),
                            currency: user?.defaultCurrency,
                            marginInfo: product.customer_price_margin,
                          })
                          const label =
                            display.kind === "hidden"
                              ? "Price on Request"
                              : display.kind === "range"
                                ? `${display.minLabel} - ${display.maxLabel}`
                                : display.label
                          return <div className="font-bold text-lg">{label}</div>
                        })()}
                      </div>
                    </Label>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Quantity Selector - type in box, Enter or blur to apply; Arrow Up/Down to change */}
          <div className="space-y-3">
            <Label className="text-base font-bold">Quantity</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-0 border-2 rounded-xl overflow-hidden bg-background">
                <Button
                  onClick={handleDecrement}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none cursor-pointer"
                  disabled={(!cartItem && quantity <= 1) || isSyncing}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                  onBlur={handleQuantityCommit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (cartItem) {
                        handleQuantityCommit()
                      } else {
                        handleAddToCart()
                      }
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault()
                      handleIncrement()
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      handleDecrement()
                    }
                  }}
                  className="w-20 text-center text-lg font-bold bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  disabled={isSyncing}
                  aria-label="Quantity"
                />
                <Button
                  onClick={handleIncrement}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-none cursor-pointer"
                  disabled={isSyncing}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-lg">
                Total: <span className="font-black text-primary text-xl">{formatPrice(totalPrice, user?.defaultCurrency)}</span>
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
            className="w-full text-lg h-14 rounded-xl font-bold cursor-pointer"
            onClick={handleAddToCart}
            disabled={isSyncing}
            variant={cartItem ? "outline" : "default"}
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {cartItem ? "Updating..." : "Adding..."}
              </span>
            ) : cartItem ? (
              `In Cart - ${formatPrice(totalPrice, user?.defaultCurrency)}`
            ) : (
              `Add to Cart - ${formatPrice(totalPrice, user?.defaultCurrency)}`
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
              {product.item_tax_template && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax template:</span>
                  <span className="font-bold">{product.item_tax_template}</span>
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
