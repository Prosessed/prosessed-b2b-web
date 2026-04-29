

"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getApiBaseUrl } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/context"
import { useCartContext } from "@/lib/cart/context"
import { useCartDrawer } from "@/lib/cart/drawer-context"
import { formatPrice } from "@/lib/utils/currency"
import { getDisplayImageUrl } from "@/lib/utils/image-url"
import { parseTags } from "@/lib/utils/tags"
import { TagBadge } from "@/components/tag-badge"
import { getPriceDisplay } from "@/lib/utils/pricing"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Minus, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useWarehousesByCustomerBranch } from "@/lib/api/hooks"

interface ProductCardProps {
  view?: "grid" | "list"
  id: string
  name: string
  price: number
  image: string
  /** Display UOM for price label (e.g. default_sales_uom). Shown as "per {unit}". */
  unit?: string
  stock?: number
  rate?: number
  customerPriceMargin?: {
    price_margin: number
    is_custom_price: number
  }
  /** Comma-separated tags from API (vtwo / item_detail). Shown as stamp on top-left when present. */
  tags?: string
  discount?: number
}

export function ProductCard({
  view = "grid",
  id,
  name,
  price,
  image,
  unit,
  stock,
  rate,
  customerPriceMargin,
  tags,
  discount,
}: ProductCardProps) {
  const displayUnit = unit || "unit"
  const tagList = parseTags(tags)
  const { cart, addItem, updateItem, removeItem, isLoading: cartLoading } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { user } = useAuth()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const [isMutating, setIsMutating] = useState(false)
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  const cartItem = cart?.items?.find((item) => item.item_code === id)
  const quantity = cartItem?.qty || 0
  const [inputVal, setInputVal] = useState(String(quantity))
  useEffect(() => {
    setInputVal(String(quantity))
  }, [quantity])

  // First-time add: add 1 quantity, then stepper (- [box] +) appears
  const handleAddOne = useCallback(async () => {
    if (!user) return
    const shouldAutoOpenCart = (cart?.items?.length ?? 0) === 0
    const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
    if (!itemRate || itemRate <= 0) return
    setIsMutating(true)
    try {
      await addItem({
        item_code: id,
        qty: 1,
        rate: itemRate,
        warehouse: resolvedWarehouse,
        uom: displayUnit,
      })
      await new Promise((r) => setTimeout(r, 100))
      if (shouldAutoOpenCart) {
        openDrawer()
      }
    } catch (e) {
      console.error("Failed to add item:", e)
    } finally {
      setIsMutating(false)
    }
  }, [cart?.items?.length, id, price, rate, displayUnit, user, resolvedWarehouse, addItem, openDrawer])

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
          warehouse: resolvedWarehouse,
          uom: displayUnit,
        })
      }
    },
    [user, cartItem, id, rate, price, displayUnit, resolvedWarehouse, addItem, updateItem, removeItem]
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={view === "grid" ? "h-full" : ""}
    >
      <Card
        className={[
          "overflow-hidden rounded-2xl border border-border/60 bg-background hover:border-primary/30 hover:shadow-xl transition-all duration-300 group relative",
          view === "grid" ? "flex flex-col h-full" : "flex flex-row",
        ].join(" ")}
      >
        {/* Tags – top-left overlay, grocery-style; click → /products?tag= */}
        {tagList.length > 0 && (
          <div
            className="absolute top-2.5 left-2.5 z-10 flex max-w-[65%] items-start justify-start text-left"
            aria-label={`Tag: ${tagList[0]}`}
          >
            <TagBadge tag={tagList[0]} variant="overlay" />
          </div>
        )}

        {/* Discount Badge */}
        {discount && discount > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-green-600 text-white px-2 py-0.5 rounded-md text-xs font-black shadow-md">
            {discount}% OFF
          </div>
        )}

        {/* Product Image Container - Fixed aspect ratio */}
        <Link href={`/products/${id}`} className={view === "grid" ? "block" : "block shrink-0"}>
          <div
            className={[
              "relative aspect-square bg-linear-to-br from-muted/30 to-muted/10 overflow-hidden",
              view === "grid" ? "w-full" : "w-28 sm:w-32",
            ].join(" ")}
          >
            <Image
              src={getDisplayImageUrl(image, getApiBaseUrl()) || "/placeholder.svg"}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              quality={90}
              className="object-contain p-2 sm:p-3"
            />
          </div>
        </Link>

        {/* Product Info - Flexible content area */}
        <CardContent
          className={view === "grid"
            ? "flex flex-col flex-1 p-3 sm:p-4 gap-2"
            : "flex flex-col justify-between flex-1 p-4 gap-2"
          }
        >
          {/* Product Name */}
          <Link href={`/products/${id}`} className="block group/name">
            <h3 className={view === "grid"
              ? "font-semibold text-sm leading-tight line-clamp-2 min-h-10 text-foreground group-hover/name:text-primary transition-colors"
              : "font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover/name:text-primary transition-colors"}
            >
              {name}
            </h3>
          </Link>

          {/* Spacer to push price and button to bottom */}
          {view === "grid" && <div className="flex-1" />}

          {/* Price Section */}
          <div className={view === "grid" ? "mb-2" : "mb-0"}>
            {(() => {
              const display = getPriceDisplay({
                basePrice: Number(price ?? 0),
                currency: user?.defaultCurrency,
                marginInfo: customerPriceMargin,
              })

              if (display.kind === "hidden") {
                return (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Price on Request</p>
                  </div>
                )
              }

              if (display.kind === "range") {
                return (
                  <div className="space-y-0.5">
                    <p className="text-base sm:text-lg font-black text-foreground leading-none">
                      {display.minLabel} - {display.maxLabel}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">per {displayUnit}</p>
                  </div>
                )
              }

              return (
                <div className="space-y-0.5">
                  <p className="text-lg sm:text-xl font-black text-foreground leading-none">
                    {display.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">per {displayUnit}</p>
                </div>
              )
            })()}
          </div>

          {/* Add to Cart Button / Quantity Stepper */}
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.div
                key="add-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  onClick={handleAddOne}
                  disabled={isMutating}
                  size="sm"
                  className={[
                    "font-black shadow-sm active:scale-[0.98] transition-all cursor-pointer",
                    view === "grid"
                      ? "w-full h-9 sm:h-10 rounded-full border-2 border-border/70 bg-background text-foreground hover:bg-accent hover:border-primary/30"
                      : "w-32 h-9 rounded-full border-2 border-border/70 bg-background text-foreground hover:bg-accent hover:border-primary/30",
                  ].join(" ")}
                >
                  {isMutating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm tracking-wide">Add</span>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="qty-stepper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-between gap-0 border-2 rounded-xl border-primary/30 bg-primary/5 shadow-sm overflow-hidden h-9 sm:h-10"
              >
                <Button
                  onClick={decrement}
                  variant="ghost"
                  size="icon"
                  disabled={isMutating}
                  className="h-full w-10 sm:w-11 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-none border-r border-primary/20 cursor-pointer"
                >
                  <Minus className="h-4 w-4 stroke-3" />
                </Button>

                <div className="relative flex items-center justify-center flex-1 h-full px-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={inputVal}
                    onChange={handleQtyInputChange}
                    onBlur={handleQtyInputBlur}
                    onFocus={() => setInputVal(String(quantity))}
                    onKeyDown={handleQtyKeyDown}
                    disabled={isMutating}
                    className="h-full w-full text-center text-sm font-black p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70"
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
                  className="h-full w-10 sm:w-11 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-none border-l border-primary/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
