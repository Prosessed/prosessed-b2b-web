"use client"

import {
  createCart,
  getCart,
  getFullCart,
  modifyCart,
  submitCart,
  type CartItem,
  type GetCartResponse,
  type GetFullCartResponse,
} from "@/lib/api/cart"
import { useAuth } from "@/lib/auth/context"
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import useSWR from "swr"

interface CartContextType {
  /** Full cart when on cart page or sidebar (get_full_cart); otherwise get_cart_v2. */
  cart: GetFullCartResponse["cart"] | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  /** Set true on cart page and when sidebar is open so fetcher uses get_full_cart. */
  setUseFullCart: (use: boolean) => void
  addItem: (item: CartItem) => Promise<void>
  updateItem: (itemId: string, updates: Partial<CartItem>) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateCart: (updates: Record<string, any>) => Promise<void>
  refreshCart: () => Promise<void>
  submitQuotation: (params?: { signature_base64?: string }) => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [quotationId, setQuotationId] = useState<string | null>(null)
  const [useFullCart, setUseFullCart] = useState(false)
  const prevCartNameRef = useRef<string | null>(null)

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    cart: GetFullCartResponse["cart"] | null
  }>(
    user ? ["cart", user.customerId, quotationId, useFullCart] : null,
    async () => {
      if (!user) return { cart: null }

      try {
        if (useFullCart) {
          const response = (await getFullCart(
            quotationId || undefined,
            user.customerId,
            user
          )) as GetFullCartResponse & { message?: { cart?: GetFullCartResponse["cart"] } }
          const cartData = response?.message?.cart ?? response?.cart ?? null
          return { cart: cartData }
        }

        const response = (await getCart(
          quotationId || undefined,
          user.customerId,
          user
        )) as GetCartResponse & { message?: { cart?: GetCartResponse["cart"] } }
        const cartData = response?.message?.cart ?? response?.cart ?? null
        return { cart: cartData as GetFullCartResponse["cart"] | null }
      } catch (err) {
        console.error("[Cart Context] Failed to fetch cart:", err)
        return { cart: null }
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
    }
  )

  // Sync quotationId from fetched cart when we get a definite cart name.
  // Never set quotationId to null here (handled by clearCart/submitQuotation)
  // to avoid a loop: key includes quotationId, so setting null refetches and can
  // briefly yield no cart, which would set null again.
  useEffect(() => {
    const cartName = data?.cart?.name ?? null
    if (cartName && cartName !== prevCartNameRef.current) {
      prevCartNameRef.current = cartName
      setQuotationId(cartName)
    } else {
      prevCartNameRef.current = cartName
    }
  }, [data?.cart?.name])

  const refreshCart = useCallback(async () => {
    await mutate()
  }, [mutate])

  /** After add/remove/update: refetch with get_full_cart when useFullCart so cart page/sidebar get full info. */
  const revalidateAfterModify = useCallback(async () => {
    if (!user) return
    const qId = quotationId || data?.cart?.name
    const fetcher = async () => {
      try {
        if (useFullCart) {
          const res = await getFullCart(
            qId || undefined,
            user.customerId,
            user
          )
          const wrapped = res as GetFullCartResponse & {
            message?: { cart?: GetFullCartResponse["cart"] }
          }
          const cartData = wrapped?.message?.cart ?? wrapped?.cart ?? null
          return { cart: cartData }
        }
        const res = await getCart(
          qId || undefined,
          user.customerId,
          user
        )
        const wrapped = res as GetCartResponse & {
          message?: { cart?: GetCartResponse["cart"] }
        }
        const cartData = wrapped?.message?.cart ?? wrapped?.cart ?? null
        return { cart: cartData as GetFullCartResponse["cart"] | null }
      } catch (err) {
        console.error("[Cart Context] Revalidate failed:", err)
        return { cart: data?.cart ?? null }
      }
    }
    await mutate(fetcher)
  }, [user, quotationId, data?.cart?.name, data?.cart, useFullCart, mutate])

  const addItem = useCallback(
    async (item: CartItem) => {
      if (!user) throw new Error("User not authenticated")

      if (!item.rate || item.rate <= 0) {
        throw new Error(
          `Invalid rate for item ${item.item_code}. Rate must be greater than 0.`
        )
      }

      const currentQuotationId = quotationId || data?.cart?.name

      const validatedItem: CartItem = {
        ...item,
        qty: item.qty || 1,
        uom: item.uom || "Units",
        warehouse: item.warehouse || user.defaultWarehouse,
      }

      try {
        if (!currentQuotationId) {
          const response = await createCart({ items: [validatedItem] }, user)
          const wrapped = response as typeof response & {
            message?: { quotation_id?: { name?: string } }
          }
          const quotationIdValue =
            response.quotation_id?.name ??
            wrapped.message?.quotation_id?.name

          if (quotationIdValue) {
            setQuotationId(quotationIdValue)
            await new Promise((r) => setTimeout(r, 200))
          }

          await revalidateAfterModify()
        } else {
          await modifyCart(
            { quotation_id: currentQuotationId, add_item: validatedItem },
            user
          )
          await revalidateAfterModify()
        }
      } catch (err) {
        console.error("[Cart Context] Failed to add item:", err)
        await revalidateAfterModify()
        throw err
      }
    },
    [user, quotationId, data?.cart, revalidateAfterModify]
  )

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<CartItem>) => {
      if (!user) throw new Error("User not authenticated")

      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")

      try {
        if (data?.cart?.items) {
          const optimisticItems = data.cart.items.map((it) =>
            it.name === itemId
              ? {
                  ...it,
                  ...updates,
                  amount:
                    (updates.qty ?? it.qty) * (it.rate || 0),
                }
              : it
          )

          mutate(
            { cart: { ...data.cart, items: optimisticItems } },
            false
          )
        }

        await modifyCart(
          {
            quotation_id: currentQuotationId,
            update_item: { item_id: itemId, ...updates },
          },
          user
        )

        await revalidateAfterModify()
      } catch (err) {
        console.error("Failed to update item:", err)
        await revalidateAfterModify()
        throw err
      }
    },
    [quotationId, data?.cart, revalidateAfterModify, user]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) throw new Error("User not authenticated")

      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")

      try {
        if (data?.cart?.items) {
          mutate(
            {
              cart: {
                ...data.cart,
                items: data.cart.items.filter(
                  (it) => it.name !== itemId
                ),
              },
            },
            false
          )
        }

        await modifyCart(
          {
            quotation_id: currentQuotationId,
            delete_item: { item_id: itemId },
          },
          user
        )

        await revalidateAfterModify()
      } catch (err) {
        console.error("Failed to remove item:", err)
        await revalidateAfterModify()
        throw err
      }
    },
    [quotationId, data?.cart, revalidateAfterModify, user]
  )

  const updateCart = useCallback(
    async (updates: Record<string, any>) => {
      if (!user) throw new Error("User not authenticated")

      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")

      await modifyCart(
        { quotation_id: currentQuotationId, update_parent: updates },
        user
      )

      await revalidateAfterModify()
    },
    [quotationId, data?.cart?.name, revalidateAfterModify, user]
  )

  const submitQuotation = useCallback(
    async (params?: { signature_base64?: string }) => {
      if (!user) throw new Error("User not authenticated")

      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")

      try {
        await submitCart(
          {
            quotation_id: currentQuotationId,
            signature_base64: params?.signature_base64,
          },
          user
        )

        // Clear cart after successful submission
        setQuotationId(null)
        await mutate({ cart: null }, false)
      } catch (error) {
        console.error("[Cart Context] Failed to submit quotation:", error)
        throw error
      }
    },
    [quotationId, data?.cart?.name, mutate, user]
  )

  const clearCart = useCallback(() => {
    setQuotationId(null)
    mutate({ cart: null }, false)
  }, [mutate])

  const contextValue = useMemo(
    () => ({
      cart: data?.cart || null,
      isLoading,
      isValidating,
      error: error as Error | null,
      setUseFullCart,
      addItem,
      updateItem,
      removeItem,
      updateCart,
      refreshCart,
      submitQuotation,
      clearCart,
    }),
    [
      data?.cart,
      isLoading,
      isValidating,
      error,
      addItem,
      updateItem,
      removeItem,
      updateCart,
      refreshCart,
      submitQuotation,
      clearCart,
    ]
  )

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider")
  }
  return context
}
