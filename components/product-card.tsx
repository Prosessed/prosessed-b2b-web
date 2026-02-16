// "use client"
// import { useState, useCallback, useEffect } from "react"
// import Image from "next/image"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Plus, Minus, Loader2 } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"
// import { useCartContext } from "@/lib/cart/context"
// import { useCartDrawer } from "@/lib/cart/drawer-context"
// import { useAuth } from "@/lib/auth/context"
// import { getApiBaseUrl } from "@/lib/api/client"
// import { formatPrice } from "@/lib/utils/currency"
// import { getDisplayImageUrl } from "@/lib/utils/image-url"

// interface ProductCardProps {
//   id: string
//   name: string
//   price: number
//   image: string
//   unit?: string
//   stock?: number
//   rate?: number
//   customerPriceMargin?: {
//     price_margin: number
//     is_custom_price: number
//   }
//   tag?: "hot-deal" | "best-seller" | "new" | "limited"
//   discount?: number
// }

// export function ProductCard({ id, name, price, image, unit = "kg", stock, rate, customerPriceMargin, tag, discount }: ProductCardProps) {
//   const { cart, addItem, updateItem, removeItem, isLoading: cartLoading } = useCartContext()
//   const { openDrawer } = useCartDrawer()
//   const { user } = useAuth()
//   const [isMutating, setIsMutating] = useState(false)

//   const cartItem = cart?.items?.find((item) => item.item_code === id)
//   const quantity = cartItem?.qty || 0
//   const [inputVal, setInputVal] = useState(String(quantity))
//   useEffect(() => {
//     setInputVal(String(quantity))
//   }, [quantity])

//   // First-time add: add 1 quantity, then stepper (- [box] +) appears
//   const handleAddOne = useCallback(async () => {
//     if (!user) return
//     const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
//     if (!itemRate || itemRate <= 0) return
//     setIsMutating(true)
//     try {
//       await addItem({
//         item_code: id,
//         qty: 1,
//         rate: itemRate,
//         warehouse: user.defaultWarehouse,
//         uom: unit,
//       })
//       await new Promise((r) => setTimeout(r, 100))
//       openDrawer()
//     } catch (e) {
//       console.error("Failed to add item:", e)
//     } finally {
//       setIsMutating(false)
//     }
//   }, [id, price, rate, unit, user, addItem, openDrawer])

//   const increment = useCallback(async () => {
//     if (!user || !cartItem) return
//     setIsMutating(true)
//     try {
//       await updateItem(cartItem.name, { qty: quantity + 1 })
//     } catch (error) {
//       console.error("Failed to update item:", error)
//     } finally {
//       setIsMutating(false)
//     }
//   }, [cartItem, quantity, updateItem, user])

//   const decrement = useCallback(async () => {
//     if (!cartItem) return
//     setIsMutating(true)
//     try {
//       if (quantity <= 1) {
//         await removeItem(cartItem.name)
//       } else {
//         await updateItem(cartItem.name, { qty: quantity - 1 })
//       }
//     } catch (error) {
//       console.error("Failed to update item:", error)
//     } finally {
//       setIsMutating(false)
//     }
//   }, [cartItem, quantity, updateItem, removeItem])

//   const applyQtyInput = useCallback(
//     async (val: string) => {
//       const n = Math.max(0, Math.floor(parseFloat(val) || 0))
//       setInputVal(String(n))
//       if (!user || n === 0) {
//         if (cartItem) await removeItem(cartItem.name)
//         return
//       }
//       const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
//       if (cartItem) {
//         await updateItem(cartItem.name, { qty: n })
//       } else if (itemRate > 0) {
//         await addItem({
//           item_code: id,
//           qty: n,
//           rate: itemRate,
//           warehouse: user.defaultWarehouse,
//           uom: unit,
//         })
//       }
//     },
//     [user, cartItem, id, rate, price, unit, addItem, updateItem, removeItem]
//   )

//   const handleQtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const v = e.target.value.replace(/\D/g, "").slice(0, 5)
//     setInputVal(v)
//   }

//   const handleQtyInputBlur = () => {
//     const val = inputVal.trim()
//     if (val === "" || val === String(quantity)) {
//       setInputVal(String(quantity))
//       return
//     }
//     setIsMutating(true)
//     applyQtyInput(val).finally(() => setIsMutating(false))
//   }

//   const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault()
//       ;(e.target as HTMLInputElement).blur()
//       return
//     }
//     if (e.key === "ArrowUp") {
//       e.preventDefault()
//       const n = Math.max(0, Math.floor(parseFloat(inputVal) || 0) + 1)
//       setInputVal(String(n))
//       return
//     }
//     if (e.key === "ArrowDown") {
//       e.preventDefault()
//       const n = Math.max(0, Math.floor(parseFloat(inputVal) || 0) - 1)
//       setInputVal(String(n))
//       return
//     }
//   }

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.2 }}
//     >
//       <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group relative">
//         {tag && (
//           <div className="absolute top-2 right-2 z-10">
//             {tag === "hot-deal" && (
//               <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
//                 🔥 Hot Deal
//               </div>
//             )}
//             {tag === "best-seller" && (
//               <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
//                 ⭐ Best Seller
//               </div>
//             )}
//             {tag === "new" && (
//               <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
//                 ✨ New
//               </div>
//             )}
//             {tag === "limited" && (
//               <div className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
//                 ⏰ Limited
//               </div>
//             )}
//           </div>
//         )}
//         {discount && discount > 0 && (
//           <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
//             -{discount}%
//           </div>
//         )}
//         <Link href={`/products/${id}`}>
//           <div className="relative aspect-square bg-muted/30 group-hover:bg-muted/50 transition-colors overflow-hidden">
//             <Image
//               src={getDisplayImageUrl(image, getApiBaseUrl()) || "/placeholder.svg"}
//               alt={name}
//               fill
//               className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
//             />
//           </div>
//         </Link>
//         <CardContent className="p-4">
//           <Link href={`/products/${id}`} className="hover:text-primary">
//             <h3 className="font-medium text-sm mb-1 line-clamp-2">{name}</h3>
//           </Link>
//           <div className="flex items-center justify-between mt-2">
//             <div>
//               {customerPriceMargin?.is_custom_price === 1 ? (
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-1">Custom Pricing</p>
//                   <p className="text-xs text-muted-foreground">Contact for quote</p>
//                 </div>
//               ) : customerPriceMargin?.is_custom_price === 0 ? (
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-1">Price on Request</p>
//                 </div>
//               ) : (
//                 <div>
//                   <p className="text-lg font-bold text-foreground">{formatPrice(price ?? 0, user?.defaultCurrency)}</p>
//                   <p className="text-xs text-muted-foreground">per {unit}</p>
//                 </div>
//               )}
//             </div>

//             <AnimatePresence mode="wait">
//               {quantity === 0 ? (
//                 <motion.div
//                   key="add-btn"
//                   initial={{ opacity: 0, x: 20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   exit={{ opacity: 0, x: 20 }}
//                   className="flex items-center"
//                 >
//                   <Button
//                     onClick={handleAddOne}
//                     disabled={isMutating}
//                     size="sm"
//                     className="h-9 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm active:scale-95 transition-all rounded-lg"
//                   >
//                     {isMutating ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       "ADD"
//                     )}
//                   </Button>
//                 </motion.div>
//               ) : (
//                 <motion.div
//                   key="qty-stepper"
//                   initial={{ opacity: 0, scale: 0.8 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.8 }}
//                   className="relative flex items-center gap-0 border rounded-lg border-primary bg-primary/5 shadow-inner overflow-hidden"
//                 >
//                   <Button
//                     onClick={decrement}
//                     variant="ghost"
//                     size="icon"
//                     disabled={isMutating}
//                     className="h-9 w-9 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-l-lg rounded-r-none"
//                   >
//                     <Minus className="h-4 w-4" />
//                   </Button>

//                   <div className="relative flex items-center justify-center min-w-[3rem] h-9">
//                     <Input
//                       type="text"
//                       inputMode="numeric"
//                       value={inputVal}
//                       onChange={handleQtyInputChange}
//                       onBlur={handleQtyInputBlur}
//                       onFocus={() => setInputVal(String(quantity))}
//                       onKeyDown={handleQtyKeyDown}
//                       disabled={isMutating}
//                       className="h-9 w-12 text-center text-sm font-bold p-1 border-0 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-70"
//                     />
//                     {isMutating && (
//                       <span className="absolute pointer-events-none flex items-center justify-center inset-0 bg-primary/5">
//                         <Loader2 className="h-4 w-4 animate-spin text-primary" />
//                       </span>
//                     )}
//                   </div>

//                   <Button
//                     onClick={increment}
//                     variant="ghost"
//                     size="icon"
//                     disabled={isMutating}
//                     className="h-9 w-9 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-r-lg rounded-l-none"
//                   >
//                     <Plus className="h-4 w-4" />
//                   </Button>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   )
// }

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
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Minus, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  unit?: string
  stock?: number
  rate?: number
  customerPriceMargin?: {
    price_margin: number
    is_custom_price: number
  }
  tag?: "hot-deal" | "best-seller" | "new" | "limited"
  discount?: number
}

export function ProductCard({ id, name, price, image, unit = "kg", stock, rate, customerPriceMargin, tag, discount }: ProductCardProps) {
  const { cart, addItem, updateItem, removeItem, isLoading: cartLoading } = useCartContext()
  const { openDrawer } = useCartDrawer()
  const { user } = useAuth()
  const [isMutating, setIsMutating] = useState(false)

  const cartItem = cart?.items?.find((item) => item.item_code === id)
  const quantity = cartItem?.qty || 0
  const [inputVal, setInputVal] = useState(String(quantity))
  useEffect(() => {
    setInputVal(String(quantity))
  }, [quantity])

  // First-time add: add 1 quantity, then stepper (- [box] +) appears
  const handleAddOne = useCallback(async () => {
    if (!user) return
    const itemRate = (rate && rate > 0) ? rate : (price && price > 0 ? price : 0)
    if (!itemRate || itemRate <= 0) return
    setIsMutating(true)
    try {
      await addItem({
        item_code: id,
        qty: 1,
        rate: itemRate,
        warehouse: user.defaultWarehouse,
        uom: unit,
      })
      await new Promise((r) => setTimeout(r, 100))
      openDrawer()
    } catch (e) {
      console.error("Failed to add item:", e)
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
          warehouse: user.defaultWarehouse,
          uom: unit,
        })
      }
    },
    [user, cartItem, id, rate, price, unit, addItem, updateItem, removeItem]
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
      className="h-full"
    >
      <Card className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/60 bg-background hover:border-primary/30 hover:shadow-xl transition-all duration-300 group relative">
        {/* Tag Badges */}
        {tag && (
          <div className="absolute top-3 left-3 z-10">
            {tag === "hot-deal" && (
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                <span className="text-xs">🔥</span>
                <span className="tracking-wide">HOT</span>
              </div>
            )}
            {tag === "best-seller" && (
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                <span className="text-xs">⭐</span>
                <span className="tracking-wide">BEST</span>
              </div>
            )}
            {tag === "new" && (
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                <span className="text-xs">✨</span>
                <span className="tracking-wide">NEW</span>
              </div>
            )}
            {tag === "limited" && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                <span className="text-xs">⚡</span>
                <span className="tracking-wide">LIMITED</span>
              </div>
            )}
          </div>
        )}

        {/* Discount Badge */}
        {discount && discount > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-green-600 text-white px-2 py-0.5 rounded-md text-xs font-black shadow-md">
            {discount}% OFF
          </div>
        )}

        {/* Product Image Container - Fixed aspect ratio */}
        <Link href={`/products/${id}`} className="block">
          <div className="relative w-full aspect-square bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
            <Image
              src={getDisplayImageUrl(image, getApiBaseUrl()) || "/placeholder.svg"}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 sm:p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          </div>
        </Link>

        {/* Product Info - Flexible content area */}
        <CardContent className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
          {/* Product Name */}
          <Link href={`/products/${id}`} className="block group/name">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem] text-foreground group-hover/name:text-primary transition-colors">
              {name}
            </h3>
          </Link>

          {/* Spacer to push price and button to bottom */}
          <div className="flex-1" />

          {/* Price Section */}
          <div className="mb-2">
            {customerPriceMargin?.is_custom_price === 1 ? (
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-500">Custom Pricing</p>
                <p className="text-[10px] text-muted-foreground">Contact for quote</p>
              </div>
            ) : customerPriceMargin?.is_custom_price === 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Price on Request</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-lg sm:text-xl font-black text-foreground leading-none">
                  {formatPrice(price ?? 0, user?.defaultCurrency)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">per {unit}</p>
              </div>
            )}
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
                  className="w-full h-9 sm:h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all rounded-xl border-2 border-primary/20"
                >
                  {isMutating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm tracking-wide">ADD</span>
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
                  className="h-full w-10 sm:w-11 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-none border-r border-primary/20"
                >
                  <Minus className="h-4 w-4 stroke-[3]" />
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
                  className="h-full w-10 sm:w-11 shrink-0 hover:bg-primary/10 text-primary transition-colors rounded-none border-l border-primary/20"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
