import { getAuthSession } from "@/lib/auth/storage.client"
import type { Quote } from "@/lib/types"

interface QuotationResponse {
  name: string
  party_name: string
  transaction_date: string
  valid_till: string
  grand_total: number
  workflow_state: string
  docstatus: number
  items: QuotationItem[]
}

interface QuotationItem {
  name: string
  item_code: string
  item_name: string
  qty: number
  uom: string
  rate: number
  amount: number
  image?: string
}

export class QuoteModel {
  static async getAll(): Promise<Quote[]> {
    try {
      const session = await getAuthSession()
      if (!session?.user) return []

      const baseUrl = session.user.baseUrl
      const response = await fetch(
        `${baseUrl}/api/method/prosessed_orderit.orderit.get_all_quotations?owner=${encodeURIComponent(
          session.user.email
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${session.user.apiKey}:${session.user.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch quotations")

      const data = await response.json()
      const quotations = (data.message || []) as QuotationResponse[]

      return quotations.map((q) => ({
        id: q.name,
        date: q.transaction_date,
        validUntil: q.valid_till,
        status: this.mapWorkflowState(q.workflow_state, q.docstatus),
        total: q.grand_total,
        items: q.items.map((item) => ({
          id: item.item_code,
          name: item.item_name,
          price: item.rate,
          image: item.image,
          quantity: item.qty,
          uom: item.uom,
        })),
      }))
    } catch (error) {
      console.error("Failed to fetch quotations:", error)
      return []
    }
  }

  static async getById(id: string): Promise<Quote | null> {
    try {
      const session = await getAuthSession()
      if (!session?.user) return null

      const baseUrl = session.user.baseUrl
      const response = await fetch(
        `${baseUrl}/api/method/prosessed_orderit.orderit.get_quotation_details?quotation_id=${encodeURIComponent(
          id
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${session.user.apiKey}:${session.user.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch quotation details")

      const data = await response.json()
      const q = data.message as QuotationResponse

      return {
        id: q.name,
        date: q.transaction_date,
        validUntil: q.valid_till,
        status: this.mapWorkflowState(q.workflow_state, q.docstatus),
        total: q.grand_total,
        items: q.items.map((item) => ({
          id: item.item_code,
          name: item.item_name,
          price: item.rate,
          image: item.image,
          quantity: item.qty,
          uom: item.uom,
        })),
      }
    } catch (error) {
      console.error("Failed to fetch quotation details:", error)
      return null
    }
  }

  private static mapWorkflowState(
    workflow_state: string,
    docstatus: number
  ): "pending" | "approved" | "rejected" | "expired" {
    // docstatus: 0 = Draft, 1 = Submitted, 2 = Cancelled
    if (docstatus === 2) return "rejected"
    if (workflow_state === "approved") return "approved"
    if (workflow_state === "expired") return "expired"
    return "pending"
  }

  static async create(quoteData: Partial<Quote>): Promise<Quote> {
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
