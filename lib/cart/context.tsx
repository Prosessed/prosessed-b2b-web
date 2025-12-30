"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from "react"
import { useAuth } from "@/lib/auth/context"
import { getCart, createCart, modifyCart, submitCart, type CartItem, type GetCartResponse, type SubmitCartParams } from "@/lib/api/cart"
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
        const response = await getCart(quotationId || undefined, user.customerId, user)
        return response
      } catch (err) {
        console.error("Failed to fetch cart:", err)
        return { cart: null }
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000,
      revalidateIfStale: true,
    }
  )

  // Update quotationId when cart data changes (prevent infinite loop with ref check)
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

      try {
        const currentQuotationId = quotationId || data?.cart?.name
        
        // Optimistic update: add item to local state immediately
        if (data?.cart) {
          const optimisticItem = {
            name: `temp-${Date.now()}`,
            item_code: item.item_code,
            item_name: item.item_code,
            qty: item.qty || 1,
            rate: item.rate || 0,
            uom: item.uom || "Unit",
            amount: (item.rate || 0) * (item.qty || 1),
            warehouse: item.warehouse || "",
            image: "",
            item_group: "",
            price_list_rate: item.rate || 0,
            discount_percentage: item.discount_percentage || 0,
            discount_amount: item.discount_amount || 0,
          } as const
          const optimisticCart = {
            ...data.cart,
            items: [...(data.cart.items || []), optimisticItem as any],
          }
          mutate({ cart: optimisticCart as any }, false)
        }

        if (!currentQuotationId) {
          const response = await createCart({ items: [item] }, user)
          if (response.quotation_id) {
            setQuotationId(response.quotation_id.name)
            // Wait a bit for state to update, then refetch
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
          await mutate()
        } else {
          await modifyCart({ quotation_id: currentQuotationId, add_item: item }, user)
          await mutate()
        }
      } catch (err) {
        console.error("Failed to add item:", err)
        // Revert optimistic update on error
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
        // Optimistic update
        if (data?.cart?.items) {
          const optimisticItems = data.cart.items.map((it) =>
            it.name === itemId ? { ...it, ...updates, amount: (updates.qty || it.qty) * (it.rate || 0) } : it
          )
          mutate({ cart: { ...data.cart, items: optimisticItems } }, false)
        }

        await modifyCart({ quotation_id: currentQuotationId, update_item: { item_id: itemId, ...updates } }, user)
        await mutate()
      } catch (err) {
        console.error("Failed to update item:", err)
        await mutate() // Revert on error
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
        // Optimistic update
        if (data?.cart?.items) {
          const optimisticItems = data.cart.items.filter((it) => it.name !== itemId)
          mutate({ cart: { ...data.cart, items: optimisticItems } }, false)
        }

        await modifyCart({ quotation_id: currentQuotationId, delete_item: { item_id: itemId } }, user)
        await mutate()
      } catch (err) {
        console.error("Failed to remove item:", err)
        await mutate() // Revert on error
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
      
      try {
        await modifyCart({ quotation_id: currentQuotationId, update_parent: updates }, user)
        mutate()
      } catch (err) {
        console.error("Failed to update cart:", err)
        throw err
      }
    },
    [quotationId, data?.cart?.name, mutate, user]
  )

  const submitQuotation = useCallback(
    async (params?: { signature_base64?: string }) => {
      if (!user) throw new Error("User not authenticated")
      const currentQuotationId = quotationId || data?.cart?.name
      if (!currentQuotationId) throw new Error("Cart not found")
      
      try {
        await submitCart({ quotation_id: currentQuotationId, signature_base64: params?.signature_base64 }, user)
        mutate()
      } catch (err) {
        console.error("Failed to submit quotation:", err)
        throw err
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
      addItem,
      updateItem,
      removeItem,
      updateCart,
      refreshCart,
      submitQuotation,
      clearCart,
    }),
    [data?.cart, isLoading, isValidating, error, addItem, updateItem, removeItem, updateCart, refreshCart, submitQuotation, clearCart]
  )

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider")
  }
  return context
}

