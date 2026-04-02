"use client"

import type { AuthUser } from "@/lib/auth/types"
import { apiClient } from "./client"

/* =========================
   CART ITEM (REQUEST)
========================= */
export interface CartItem {
  item_code: string
  qty: number
  rate: number
  warehouse: string
  uom?: string
  discount_percentage?: number
  discount_amount?: number
  custom_quotation_item_details?: string
}

/* =========================
   CREATE CART
========================= */
export interface CreateCartParams {
  items: CartItem[]
  customer_address?: string
  shipping_address_name?: string
  apply_discount_on?: "Net Total" | "Grand Total"
  additional_discount_percentage?: number
  discount_amount?: number
  payment_terms_template?: string
  coupon_code?: string
  trip_id?: string
}

export interface CartResponse {
  status: "success" | "error"
  message: string
  quotation_id?: {
    name: string
    party_name: string
    company: string
    transaction_date: string
    valid_till: string
    grand_total: number
    workflow_state: string
    docstatus: number
  } | null
}

/* =========================
   CART ITEM (RESPONSE)
========================= */
export interface CartItemResponse {
  name: string
  item_code: string
  item_name: string
  qty: number
  rate: number
  uom: string
  amount: number
  warehouse: string
  discount_percentage: number
  discount_amount: number
  item_group: string
  image?: string
  price_list_rate: number
  custom_quotation_item_details?: string
}

/* =========================
   GET CART RESPONSE (get_cart_v2 – product pages, header, etc.)
========================= */
export interface GetCartResponse {
  cart: {
    name: string
    party_name: string
    company: string
    customer_address?: string
    shipping_address_name?: string
    apply_discount_on?: string
    additional_discount_percentage?: number
    discount_amount?: number
    grand_total: number
    workflow_state: string
    payment_terms_template?: string
    pricing_rules?: any[]
    items: CartItemResponse[]
  } | null
}

/* =========================
   FULL CART ITEM (get_full_cart response – cart page & sidebar)
========================= */
export interface FullCartItemResponse extends CartItemResponse {
  description?: string
  net_rate?: number
  net_amount?: number
  base_rate?: number
  base_amount?: number
  stock_uom?: string
  conversion_factor?: number
  stock_qty?: number
  brand?: string | null
  item_tax_rate?: string
  item_tax_template?: string
  pricing_rules?: unknown
}

/* =========================
   FULL CART (get_full_cart – cart page & sidebar only)
========================= */
export interface FullCartTax {
  name: string
  charge_type: string
  account_head: string
  description: string
  rate: number
  tax_amount: number
  total: number
  base_tax_amount: number
  base_total: number
}

export interface GetFullCartResponse {
  cart: {
    name: string
    party_name: string
    company: string
    currency?: string
    conversion_rate?: number
    customer_address?: string
    shipping_address_name?: string
    apply_discount_on?: string
    additional_discount_percentage?: number
    discount_amount?: number
    total?: number
    net_total?: number
    base_net_total?: number
    grand_total: number
    base_grand_total?: number
    rounded_total?: number
    total_taxes_and_charges?: number
    total_qty?: number
    total_net_weight?: number
    in_words?: string
    custom_quotation_detail_notes?: string
    pricing_rules?: unknown[]
    payment_terms_template?: string
    workflow_state: string
    taxes_and_charges?: string
    taxes?: FullCartTax[]
    items: FullCartItemResponse[]
  } | null
}

/* =========================
   MODIFY CART
========================= */
export interface ModifyCartParams {
  quotation_id: string
  update_parent?: Record<string, any>
  update_item?: { item_id: string; [key: string]: any }
  delete_item?: { item_id: string }
  add_item?: CartItem
  add_items?: CartItem[]
}

export interface ModifyCartResponse {
  status: "success" | "error"
  quotation?: GetCartResponse["cart"] | null
  message?: string
}

/* =========================
   SUBMIT CART
========================= */
export interface SubmitCartParams {
  quotation_id: string
  signature_base64?: string
  /**
   * Backend toggle: create Sales Order vs create Quotation.
   * Expected shape (from backend): { create_order: 1|0, create_quote: 1|0 }
   */
  order_quote_logic?: {
    create_order?: number | null
    create_quote?: number | null
  } | null
}

export interface SubmitCartResponse {
  status: "success" | "error" | "info"
  message: string
  quotation_id: string
  workflow_state: string
  signature_url?: string
}

/* =========================
   CREATE SALES ORDER FROM CART
========================= */
export interface CreateSalesOrderFromCartParams {
  quotation_id: string
  latitude: string
  longitude: string
  /** Expected format: YYYY-MM-DD */
  delivery_date: string
}

export interface CreateSalesOrderFromCartResponse {
  status: "success" | "error" | "info"
  message: string
  order_id?: string
  sales_order_id?: string
  workflow_state?: string
}

/* =========================
   API FUNCTIONS
========================= */
export async function createCart(
  params: CreateCartParams,
  user: AuthUser
): Promise<CartResponse> {
  if (!user) throw new Error("User not authenticated")

  return apiClient.request<CartResponse>(
    "/api/method/prosessed_orderit.orderit.create_cart_quotation",
    {
      method: "POST",
      body: JSON.stringify({
        customer_id: user.customerId,
        company: user.companyName,
        ...params,
      }),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}

export async function getCart(
  quotationId: string | undefined,
  customerId: string | undefined,
  user: AuthUser
): Promise<GetCartResponse> {
  if (!user) throw new Error("User not authenticated")

  return apiClient.request<GetCartResponse>(
    "/api/method/prosessed_orderit.orderit.get_cart_v2",
    {
      method: "POST",
      body: JSON.stringify({
        quotation: quotationId,
        customer_id: customerId || user.customerId,
      }),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}

/** Use on cart page and cart sidebar when showing cart details (after add/remove/modify). */
export async function getFullCart(
  quotationId: string | undefined,
  customerId: string | undefined,
  user: AuthUser
): Promise<GetFullCartResponse> {
  if (!user) throw new Error("User not authenticated")

  return apiClient.request<GetFullCartResponse>(
    "/api/method/prosessed_orderit.orderit.get_full_cart",
    {
      method: "POST",
      body: JSON.stringify({
        quotation: quotationId,
        customer_id: customerId || user.customerId,
      }),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}

export async function modifyCart(
  params: ModifyCartParams,
  user: AuthUser
): Promise<ModifyCartResponse> {
  if (!user) throw new Error("User not authenticated")

  const body: any = {
    quotation_id: params.quotation_id,
  }

  if (params.update_parent)
    body.update_parent = JSON.stringify(params.update_parent)
  if (params.update_item)
    body.update_item = JSON.stringify(params.update_item)
  if (params.delete_item)
    body.delete_item = JSON.stringify(params.delete_item)
  if (params.add_item)
    body.add_item = JSON.stringify(params.add_item)
  if (params.add_items)
    body.add_items = JSON.stringify(params.add_items)

  return apiClient.request<ModifyCartResponse>(
    "/api/method/prosessed_orderit.orderit.modify_cart_v3",
    {
      method: "POST",
      body: JSON.stringify(body),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}

export async function submitCart(
  params: SubmitCartParams,
  user: AuthUser
): Promise<SubmitCartResponse> {
  if (!user) throw new Error("User not authenticated")

  return apiClient.request<SubmitCartResponse>(
    "/api/method/prosessed_orderit.orderit.submit_cart_quotation",
    {
      method: "POST",
      body: JSON.stringify(params),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}

export async function createSalesOrderFromCart(
  params: CreateSalesOrderFromCartParams,
  user: AuthUser
): Promise<CreateSalesOrderFromCartResponse> {
  if (!user) throw new Error("User not authenticated")

  return apiClient.request<CreateSalesOrderFromCartResponse>(
    "/api/method/prosessed_orderit.orderit.create_sales_order_from_cart",
    {
      method: "POST",
      body: JSON.stringify(params),
      auth: {
        apiKey: user.apiKey,
        apiSecret: user.apiSecret,
        sid: user.sid,
      },
    }
  )
}
