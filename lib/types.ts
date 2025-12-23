export interface Product {
  id: string
  name: string
  price: number
  image: string
  description?: string
  category?: string
  brand?: string
  unit?: string
  inStock?: boolean
}

export interface CartItem extends Product {
  quantity: number
  notes?: string
  uom?: string
}

export interface Order {
  id: string
  date: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  total: number
  items: CartItem[]
}

export interface Quote {
  id: string
  date: string
  status: "pending" | "approved" | "rejected" | "expired"
  total: number
  items: CartItem[]
  validUntil: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}
