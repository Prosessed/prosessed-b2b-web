import type { Order } from "@/lib/types"

export class OrderModel {
  static async getAll(): Promise<Order[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/orders')
    // return response.json()

    return mockOrders
  }

  static async getById(id: string): Promise<Order | null> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/orders/${id}`)
    // return response.json()

    const orders = await this.getAll()
    return orders.find((o) => o.id === id) || null
  }

  static async create(orderData: Partial<Order>): Promise<Order> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/orders', {
    //   method: 'POST',
    //   body: JSON.stringify(orderData)
    // })
    // return response.json()

    const newOrder: Order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: "pending",
      total: 0,
      items: [],
      ...orderData,
    } as Order

    return newOrder
  }
}

// Mock data - replace with actual API calls
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    status: "delivered",
    total: 156.95,
    items: [
      { id: "1", name: "Organic Tomatoes", price: 12.99, image: "/ripe-tomatoes.png", quantity: 5, uom: "kg" },
      { id: "2", name: "Fresh Avocados", price: 18.99, image: "/ripe-avocados.png", quantity: 3, uom: "kg" },
      { id: "6", name: "Bulk Rice 25kg", price: 45.99, image: "/rice-bag.png", quantity: 2, uom: "bag" },
    ],
  },
  {
    id: "ORD-002",
    date: "2024-01-18",
    status: "shipped",
    total: 89.97,
    items: [
      { id: "4", name: "Artisan Bread", price: 8.99, image: "/rustic-bread-loaf.png", quantity: 10, uom: "loaf" },
    ],
  },
  {
    id: "ORD-003",
    date: "2024-01-20",
    status: "processing",
    total: 124.96,
    items: [
      { id: "7", name: "Fresh Salmon Fillet", price: 32.99, image: "/fresh-salmon-fillet.png", quantity: 3, uom: "kg" },
      { id: "8", name: "Organic Honey 2L", price: 28.99, image: "/golden-honey-jar.png", quantity: 1, uom: "bottle" },
    ],
  },
]
