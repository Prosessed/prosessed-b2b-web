"use client"

import {
  createCart,
  getCart,
  modifyCart,
  submitCart,
  type CartItem,
  type GetCartResponse,
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
  cart: GetCartResponse["cart"] | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
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
  const prevCartNameRef = useRef<string | null>(null)

  const { data, error, isLoading, isValidating, mutate } = useSWR<GetCartResponse>(
    user ? ["cart", user.customerId, quotationId] : null,
    async () => {
      if (!user) return { cart: null }

      try {
        const response = await getCart(
          quotationId || undefined,
          user.customerId,
          user
        )

        // Normalize backend response - handle both direct and wrapped formats
        const cartData = response?.message?.cart || response?.cart || null
        return {
          cart: cartData,
        }
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

  // Sync quotationId from fetched cart
  useEffect(() => {
    const cartName = data?.cart?.name || null
    if (cartName !== prevCartNameRef.current) {
      prevCartNameRef.current = cartName
      setQuotationId(cartName)
    }
  }, [data?.cart?.name])

  const refreshCart = useCallback(async () => {
    await mutate()
  }, [mutate])

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
        uom: item.uom || "Unit",
        warehouse: item.warehouse || user.defaultWarehouse,
      }

      try {
        if (!currentQuotationId) {
          const response = await createCart({ items: [validatedItem] }, user)
          const quotationIdValue =
            response.quotation_id?.name ||
            response.message?.quotation_id?.name

          if (quotationIdValue) {
            setQuotationId(quotationIdValue)
            await new Promise((r) => setTimeout(r, 200))
          }

          await mutate()
        } else {
          await modifyCart(
            { quotation_id: currentQuotationId, add_item: validatedItem },
            user
          )
          await mutate()
        }
      } catch (err) {
        console.error("[Cart Context] Failed to add item:", err)
        await mutate()
        throw err
      }
    },
    [user, quotationId, data?.cart, mutate]
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

        await mutate()
      } catch (err) {
        console.error("Failed to update item:", err)
        await mutate()
        throw err
      }
    },
    [quotationId, data?.cart, mutate, user]
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

        await mutate()
      } catch (err) {
        console.error("Failed to remove item:", err)
        await mutate()
        throw err
      }
    },
    [quotationId, data?.cart, mutate, user]
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

      await mutate()
    },
    [quotationId, data?.cart?.name, mutate, user]
  )

  const submitQuotation = useCallback(
    async (params?: { signature_base64?: string }) => {
      if (!user) throw new Error("User not authenticated")

      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")

      await submitCart(
        {
          quotation_id: currentQuotationId,
          signature_base64: params?.signature_base64,
        },
        user
      )

      await mutate()
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
