// Quotes Feature Types

export interface Quotation {
  name: string
  creation: string
  total: number
  taxes_and_charges: number
  items?: QuotationItem[]
  customer_name?: string
  docstatus: number // 0: Draft, 1: Submitted, 2: Cancelled
  status?: string
}

export interface QuotationItem {
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
  uom?: string
  image?: string
}

export interface QuotationDetail extends Quotation {
  company: string
  customer: string
  warehouse: string
  notes?: string
  items: QuotationItem[]
}

export interface SubmitQuotationResponse {
  success: boolean
  quotation_id: string
  message: string
}
