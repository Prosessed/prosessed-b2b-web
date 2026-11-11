"use client"

import {
  createCart,
  createSalesOrderFromCart,
  getCart,
  getFullCart,
  modifyCart,
  submitCart,
  type CartItem,
  type GetCartResponse,
  type GetFullCartResponse,
  type CreateSalesOrderFromCartParams,
  type SubmitCartParams,
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
import { findCartLineByItemCode } from "@/lib/cart/utils"

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
  submitQuotation: (params?: { signature_base64?: string; order_quote_logic?: SubmitCartParams["order_quote_logic"] }) => Promise<void>
  placeOrder: (params: Omit<CreateSalesOrderFromCartParams, "quotation_id">) => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [quotationId, setQuotationId] = useState<string | null>(null)
  const [useFullCart, setUseFullCart] = useState(false)
  const prevCartNameRef = useRef<string | null>(null)

  // `quotationId`/`data.cart` (React state) only reflect reality once a render has
  // committed. Two "Add" taps on different product cards fire independent addItem()
  // calls before either commit lands — both would see an empty cart and both call
  // createCart(), creating two separate quotations (one item silently orphaned).
  // These refs are updated synchronously at the source of truth, and every mutation
  // is funneled through `enqueue` so calls run one at a time, each reading the
  // previous call's outcome instead of a stale closure.
  const quotationIdRef = useRef<string | null>(null)
  const cartRef = useRef<GetFullCartResponse["cart"] | null>(null)
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve())

  const setQuotationIdSynced = useCallback((id: string | null) => {
    quotationIdRef.current = id
    setQuotationId(id)
  }, [])

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = mutationQueueRef.current.then(task, task)
    mutationQueueRef.current = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }, [])

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
      setQuotationIdSynced(cartName)
    } else {
      prevCartNameRef.current = cartName
    }
  }, [data?.cart?.name, setQuotationIdSynced])

  // Keep cartRef current for any update that lands outside our own mutate() calls
  // below (e.g. the initial SWR fetch, or a key-change refetch).
  useEffect(() => {
    cartRef.current = data?.cart ?? null
  }, [data?.cart])

  const refreshCart = useCallback(async () => {
    await mutate()
  }, [mutate])

  /** After add/remove/update: refetch with get_full_cart when useFullCart so cart page/sidebar get full info. */
  const revalidateAfterModify = useCallback(async () => {
    if (!user) return
    const qId = quotationIdRef.current || cartRef.current?.name
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
        return { cart: cartRef.current }
      }
    }
    const result = await mutate(fetcher)
    cartRef.current = result?.cart ?? null
  }, [user, useFullCart, mutate])

  const addItem = useCallback(
    async (item: CartItem) => {
      if (!user) throw new Error("User not authenticated")

      if (!item.rate || item.rate <= 0) {
        throw new Error(
          `Invalid rate for item ${item.item_code}. Rate must be greater than 0.`
        )
      }

      const validatedItem: CartItem = {
        ...item,
        qty: item.qty || 1,
        uom: item.uom || "Units",
        warehouse: item.warehouse || user.defaultWarehouse,
      }

      return enqueue(async () => {
        // Read live state at the moment this call actually runs (after any
        // earlier queued mutation has finished), not at the moment it was
        // requested — otherwise two rapid "Add" taps race on cart creation.
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name

        try {
          const existingLine = findCartLineByItemCode(
            cartRef.current?.items,
            validatedItem.item_code
          )

          if (!currentQuotationId) {
            const response = await createCart({ items: [validatedItem] }, user)
            const wrapped = response as typeof response & {
              message?: { quotation_id?: { name?: string } }
            }
            const quotationIdValue =
              response.quotation_id?.name ??
              wrapped.message?.quotation_id?.name

            if (quotationIdValue) {
              setQuotationIdSynced(quotationIdValue)
              await new Promise((r) => setTimeout(r, 200))
            }

            await revalidateAfterModify()
          } else if (existingLine) {
            // Same item already in cart — set qty (do not add a duplicate line)
            await modifyCart(
              {
                quotation_id: currentQuotationId,
                update_item: {
                  item_id: existingLine.name,
                  qty: validatedItem.qty,
                  rate: validatedItem.rate,
                  uom: validatedItem.uom,
                  warehouse: validatedItem.warehouse,
                  ...(validatedItem.custom_quotation_item_details != null && {
                    custom_quotation_item_details:
                      validatedItem.custom_quotation_item_details,
                  }),
                },
              },
              user
            )
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
      })
    },
    [user, enqueue, setQuotationIdSynced, revalidateAfterModify]
  )

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<CartItem>) => {
      if (!user) throw new Error("User not authenticated")

      return enqueue(async () => {
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name
        if (!currentQuotationId) throw new Error("Cart not found")

        try {
          const currentCart = cartRef.current
          if (currentCart?.items) {
            const optimisticItems = currentCart.items.map((it) =>
              it.name === itemId
                ? {
                    ...it,
                    ...updates,
                    amount:
                      (updates.qty ?? it.qty) * (it.rate || 0),
                  }
                : it
            )
            const optimisticCart = { ...currentCart, items: optimisticItems }
            cartRef.current = optimisticCart
            mutate({ cart: optimisticCart }, false)
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
      })
    },
    [enqueue, revalidateAfterModify, user, mutate]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) throw new Error("User not authenticated")

      return enqueue(async () => {
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name
        if (!currentQuotationId) throw new Error("Cart not found")

        try {
          const currentCart = cartRef.current
          if (currentCart?.items) {
            const optimisticCart = {
              ...currentCart,
              items: currentCart.items.filter((it) => it.name !== itemId),
            }
            cartRef.current = optimisticCart
            mutate({ cart: optimisticCart }, false)
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
      })
    },
    [enqueue, revalidateAfterModify, user, mutate]
  )

  const updateCart = useCallback(
    async (updates: Record<string, any>) => {
      if (!user) throw new Error("User not authenticated")

      return enqueue(async () => {
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name
        if (!currentQuotationId) throw new Error("Cart not found")

        await modifyCart(
          { quotation_id: currentQuotationId, update_parent: updates },
          user
        )

        await revalidateAfterModify()
      })
    },
    [enqueue, revalidateAfterModify, user]
  )

  const submitQuotation = useCallback(
    async (params?: { signature_base64?: string; order_quote_logic?: SubmitCartParams["order_quote_logic"] }) => {
      if (!user) throw new Error("User not authenticated")

      return enqueue(async () => {
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name
        if (!currentQuotationId) throw new Error("Cart not found")

        const itemCount = cartRef.current?.items?.length ?? 0
        if (itemCount === 0) {
          throw new Error("Your cart is empty. Add items before submitting.")
        }

        try {
          await submitCart(
            {
              quotation_id: currentQuotationId,
              signature_base64: params?.signature_base64,
              order_quote_logic: params?.order_quote_logic,
            },
            user
          )

          // Clear cart after successful submission
          setQuotationIdSynced(null)
          cartRef.current = null
          await mutate({ cart: null }, false)
        } catch (error) {
          console.error("[Cart Context] Failed to submit quotation:", error)
          throw error
        }
      })
    },
    [enqueue, setQuotationIdSynced, mutate, user]
  )

  const placeOrder = useCallback(
    async (params: Omit<CreateSalesOrderFromCartParams, "quotation_id">) => {
      if (!user) throw new Error("User not authenticated")

      return enqueue(async () => {
        const currentQuotationId = quotationIdRef.current || cartRef.current?.name
        if (!currentQuotationId) throw new Error("Cart not found")

        const itemCount = cartRef.current?.items?.length ?? 0
        if (itemCount === 0) {
          throw new Error("Your cart is empty. Add items before placing an order.")
        }

        try {
          await createSalesOrderFromCart(
            {
              quotation_id: currentQuotationId,
              latitude: params.latitude,
              longitude: params.longitude,
              delivery_date: params.delivery_date,
              custom_order_source: params.custom_order_source,
            },
            user
          )

          setQuotationIdSynced(null)
          cartRef.current = null
          await mutate({ cart: null }, false)
        } catch (error) {
          console.error("[Cart Context] Failed to place order:", error)
          throw error
        }
      })
    },
    [enqueue, setQuotationIdSynced, mutate, user]
  )

  const clearCart = useCallback(() => {
    setQuotationIdSynced(null)
    cartRef.current = null
    mutate({ cart: null }, false)
  }, [mutate, setQuotationIdSynced])

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
      placeOrder,
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
      placeOrder,
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
