// Cart Feature Types

export interface CartItem {
  item_code: string
  qty: number
  rate: number
  warehouse?: string
  uom?: string
  name?: string
  item_name?: string
  image?: string
  amount?: number
}

export interface Cart {
  name: string
  items: CartItemResponse[]
  grand_total: number
  total_qty: number
}

export interface CartItemResponse extends CartItem {
  name: string
  item_name: string
  image?: string
  amount: number
}

export interface CartContext {
  cart: Cart | null
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
