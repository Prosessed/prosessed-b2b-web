import type { Quote } from "@/lib/types"

export class QuoteModel {
  static async getAll(): Promise<Quote[]> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/quotes')
    // return response.json()

    return mockQuotes
  }

  static async getById(id: string): Promise<Quote | null> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch(`/api/quotes/${id}`)
    // return response.json()

    const quotes = await this.getAll()
    return quotes.find((q) => q.id === id) || null
  }

  static async create(quoteData: Partial<Quote>): Promise<Quote> {
    // TODO: Replace with actual API call
    // Example: const response = await fetch('/api/quotes', {
    //   method: 'POST',
    //   body: JSON.stringify(quoteData)
    // })
    // return response.json()

    const newQuote: Quote = {
      id: `QTE-${Date.now()}`,
      date: new Date().toISOString(),
      status: "pending",
      total: 0,
      items: [],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...quoteData,
    } as Quote

    return newQuote
  }
}

// Mock data - replace with actual API calls
const mockQuotes: Quote[] = [
  {
    id: "QTE-001",
    date: "2024-01-10",
    status: "approved",
    total: 2499.5,
    validUntil: "2024-01-24",
    items: [
      { id: "6", name: "Bulk Rice 25kg", price: 45.99, image: "/rice-bag.png", quantity: 50, uom: "bag" },
      { id: "3", name: "Premium Olive Oil", price: 24.99, image: "/olive-oil-bottle.png", quantity: 10, uom: "L" },
    ],
  },
  {
    id: "QTE-002",
    date: "2024-01-22",
    status: "pending",
    total: 1890.0,
    validUntil: "2024-02-05",
    items: [
      {
        id: "9",
        name: "Premium Coffee Beans",
        price: 34.99,
        image: "/pile-of-coffee-beans.png",
        quantity: 30,
        uom: "kg",
      },
      {
        id: "12",
        name: "Aged Cheddar Cheese",
        price: 28.99,
        image: "/aged-cheddar-cheese.png",
        quantity: 20,
        uom: "kg",
      },
    ],
  },
]
