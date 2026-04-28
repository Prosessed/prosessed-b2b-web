"use client"

import { useAuth } from "@/lib/auth/context"
import useSWR from "swr"
import { apiClient } from "./client"
import {
  appendOrderitToSearchParams,
  fetchOrderitSettings,
  mergeOrderitIntoBody,
} from "./orderit-settings"

const isTruthyOne = (v: unknown): boolean => v === 1 || v === "1" || v === true

type WarehousesByCustomerBranchResponse = {
  filtered?: boolean
  customer_branch?: string
  default_warehouse?: string
  warehouses?: unknown[]
}

const getWarehousesByCustomerBranch = async (
  auth: { apiKey?: string | null; apiSecret?: string | null; sid?: string | null },
  customerId: string,
  company?: string | null
) => {
  const search = new URLSearchParams({
    customer_id: customerId,
  })
  if (company) search.set("company", company)
  const response = await apiClient.request<any>(
    `/api/method/prosessed_orderit.orderit.get_warehouses_based_on_customer_branch?${search.toString()}`,
    {
      method: "GET",
      auth,
    }
  )
  const raw = response?.message ?? response
  return (raw && typeof raw === "object" ? (raw as WarehousesByCustomerBranchResponse) : null) as
    | WarehousesByCustomerBranchResponse
    | null
}

export const useWarehousesByCustomerBranch = (customerIdOverride?: string | null) => {
  const { user } = useAuth()
  const customerId = customerIdOverride ?? user?.customerId ?? null

  const key = user && customerId ? ["warehousesByCustomerBranch", customerId, user.companyName, user.apiKey] : null

  return useSWR(
    key,
    async () => {
      if (!user || !customerId) return null
      const auth = { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      return await getWarehousesByCustomerBranch(auth, customerId, user.companyName)
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )
}

export interface UseItemsParams {
  item_group?: string
  page?: number
  page_size?: number
  search_term?: string
  is_search?: boolean
  /** API sort: asc = low→high, desc = high→low (qty/price per backend) */
  sortByQty?: "asc" | "desc"
  filterByBrand?: string | string[]
  /** true = in stock only; false = include out of stock; undefined = follow OrderIT settings only */
  inStockOnly?: boolean | null
  qty?: number
}

export function useItems(params: UseItemsParams) {
  const { user } = useAuth()

  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  const key = user ? ["items", params, user.customerId, resolvedWarehouse] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      // Format filterByBrand - can be array or string
      let filterByBrand: string | string[] | undefined = params.filterByBrand
      if (Array.isArray(filterByBrand) && filterByBrand.length === 0) {
        filterByBrand = undefined
      }

      const endpoint = params.item_group
        ? "/api/method/prosessed_orderit.orderit.get_items_from_item_group_vtwo"
        : "/api/method/prosessed_orderit.orderit_app.apis.quickaccess.all_items.all_items.get_all_items_card_v2"

      const auth = { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      const settings = await fetchOrderitSettings(auth)

      const baseBody: Record<string, unknown> = {
        item_group: params.item_group,
        customer: user.customerId,
        warehouse: resolvedWarehouse,
        company: user.companyName,
        page: params.page || 1,
        page_size: params.page_size || 20,
        search_term: params.search_term,
        is_search: params.is_search || false,
        filterByBrand: filterByBrand,
        qty: params.qty || 1.0,
      }
      // sortByQty only when product page selects price low/high (asc/desc); otherwise recommended via merge
      if (params.sortByQty === "asc" || params.sortByQty === "desc") {
        baseBody.sortByQty = params.sortByQty
      }
      if (params.inStockOnly === true) {
        baseBody.inStockOnly = 1
      } else if (params.inStockOnly === false) {
        baseBody.inStockOnly = 0
      }

      const body = mergeOrderitIntoBody(baseBody, settings, {
        // Do not apply in-stock filter from portal settings on initial load; only when user explicitly sets it
        inStockOnlyOverride:
          params.inStockOnly === true ? true : params.inStockOnly === false ? false : undefined,
        sortByQty:
          params.sortByQty === "asc" || params.sortByQty === "desc" ? params.sortByQty : undefined,
      })

      const extraParams = new URLSearchParams()
      const resolvedInStockOnly =
        params.inStockOnly === true
          ? "1"
          : params.inStockOnly === false
            ? "0"
            : settings && isTruthyOne((settings as any).show_in_stock_only)
              ? "1"
              : "0"
      extraParams.set("inStockOnly", resolvedInStockOnly)
      if (resolvedInStockOnly === "1") {
        extraParams.set("warehouse", String(resolvedWarehouse || ""))
        if (!(params.sortByQty === "asc" || params.sortByQty === "desc")) {
          extraParams.set("sortByRecommended", "1")
        }
      }
      const endpointWithParams = extraParams.toString() ? `${endpoint}?${extraParams}` : endpoint

      const response = await apiClient.request<any>(endpointWithParams, {
        method: "POST",
        body: JSON.stringify(body),
        auth: {
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          sid: user.sid,
        },
      })

      // Normalize response so UI can rely on message.items + message.pagination
      const raw = response?.message || response
      const items = Array.isArray(raw?.items) ? raw.items : []
      const totalRecords =
        typeof raw?.total_records === "number"
          ? raw.total_records
          : typeof raw?.totalRecords === "number"
            ? raw.totalRecords
            : undefined

      const page = params.page || 1
      const pageSize = params.page_size || 20
      const derivedPagination =
        typeof totalRecords === "number"
          ? {
              total_records: totalRecords,
              has_next_page: page * pageSize < totalRecords,
            }
          : undefined

      const existingMessage = response?.message && typeof response.message === "object" ? response.message : undefined
      const normalizedMessage = {
        ...(existingMessage as any),
        items: existingMessage?.items ?? raw?.items ?? items,
        pagination: existingMessage?.pagination ?? raw?.pagination ?? derivedPagination,
        brands: existingMessage?.brands ?? raw?.brands,
      }

      return {
        ...response,
        items: response?.items ?? raw?.items ?? items,
        total_records: response?.total_records ?? raw?.total_records ?? totalRecords,
        message: normalizedMessage,
      }
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )
}

export interface UseSearchParams {
  search_key: string
  page?: number
  page_size?: number
  sortByQty?: "asc" | "desc"
  inStockOnly?: boolean | null
}

export function useSearch(
  term: string,
  page: number = 1,
  pageSize: number = 10,
  options?: { sortByQty?: "asc" | "desc"; inStockOnly?: boolean | null }
) {
  const { user } = useAuth()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  const key =
    user && term && term.length >= 2
      ? [
          "search",
          term,
          page,
          pageSize,
          user.customerId,
          options?.sortByQty,
          options?.inStockOnly,
          resolvedWarehouse,
        ]
      : null

  return useSWR(
    key,
    async () => {
      if (!user || !term || term.length < 2) return null

      const auth = { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      const settings = await fetchOrderitSettings(auth)

      const baseBody: Record<string, unknown> = {
        search_key: term,
        customer: user.customerId,
        warehouse: resolvedWarehouse,
        company: user.companyName,
        include_item_details: true,
        page: page,
        page_size: pageSize,
      }
      const requestBody = mergeOrderitIntoBody(baseBody, settings, {
        sortByQty: options?.sortByQty,
        // Same behavior as items/most-bought: only respect in-stock when user explicitly turns it on
        inStockOnlyOverride:
          options?.inStockOnly === true ? true : options?.inStockOnly === false ? false : undefined,
      })

      console.log(`[Search API] Request:`, requestBody)

      const extraParams = new URLSearchParams()
      const resolvedInStockOnly =
        options?.inStockOnly === true
          ? "1"
          : options?.inStockOnly === false
            ? "0"
            : settings && isTruthyOne((settings as any).show_in_stock_only)
              ? "1"
              : "0"
      extraParams.set("inStockOnly", resolvedInStockOnly)
      if (resolvedInStockOnly === "1") {
        extraParams.set("warehouse", String(resolvedWarehouse || ""))
        if (!(options?.sortByQty === "asc" || options?.sortByQty === "desc")) {
          extraParams.set("sortByRecommended", "1")
        }
      }
      const endpoint =
        extraParams.toString().length > 0
          ? `/api/method/prosessed_orderit.orderit.search_items?${extraParams}`
          : "/api/method/prosessed_orderit.orderit.search_items"

      const response = await apiClient.request<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
        auth: {
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          sid: user.sid,
        },
      })

      console.log(`[Search API] POST /api/method/prosessed_orderit.orderit.search_items - Term: "${term}" - Status: OK`)
      console.log(`[Search API] Response:`, {
        hasItems: !!response?.items,
        itemsCount: response?.items?.length || 0,
        hasMessage: !!response?.message,
        messageItems: response?.message?.items?.length || 0,
        directItems: response?.items?.length || 0,
      })

      // Handle both wrapped (message) and direct response structures
      const result = response?.message || response
      return result
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 500, // Rate limiting: prevent too frequent requests
      revalidateIfStale: false,
    },
  )
}

export interface UseMostBoughtItemsParams {
  time_frame?: string
  min_purchase_count?: number
  page?: number
  page_size?: number
  sortByQty?: "asc" | "desc"
  filterByBrand?: string | string[]
  inStockOnly?: boolean | null
  warehouse?: string
}

export function useItemDetails(itemCode: string | null, qty: number = 1) {
  const { user } = useAuth()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  // Don't include qty in key to avoid refetching on quantity change - price calculation happens client-side
  const key = user && itemCode ? ["itemDetails", itemCode, user.customerId, resolvedWarehouse] : null

  return useSWR(
    key,
    async () => {
      if (!user || !itemCode) return null

      const response = await apiClient.request<any>("/api/method/prosessed_orderit.orderit.get_item_details", {
        method: "POST",
        body: JSON.stringify({
          item_code: itemCode,
          customer: user.customerId,
          qty: qty,
          warehouse: resolvedWarehouse,
          company: user.companyName,
        }),
        auth: {
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          sid: user.sid,
        },
      })
      console.log(`[Item Details API] POST /api/method/prosessed_orderit.orderit.get_item_details - Item: ${itemCode} - Status: OK`)
      console.log(`[Item Details API] Response structure:`, {
        hasMessage: !!response?.message,
        hasItemCode: !!response?.item_code,
        messageItemCode: response?.message?.item_code,
        directItemCode: response?.item_code,
        rate: response?.rate || response?.message?.rate,
        price_list_rate: response?.price_list_rate || response?.message?.price_list_rate
      })
      // Handle both wrapped (message) and direct response structures
      return response?.message || response
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: false, // Don't keep previous data when itemCode changes
    },
  )
}

export function useMostBoughtItems(params?: UseMostBoughtItemsParams) {
  const { user } = useAuth()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  const key = user && params ? ["mostBought", params, user.customerId, resolvedWarehouse] : null

  return useSWR(
    key,
    async () => {
      if (!user || !params) return null

      let filterByBrand: string | string[] | undefined = params.filterByBrand
      if (Array.isArray(filterByBrand) && filterByBrand.length === 0) {
        filterByBrand = undefined
      }

      const url = "/api/method/prosessed_orderit.orderit.get_most_bought_items_vtwo"
      const auth = { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      const settings = await fetchOrderitSettings(auth)

      const baseBody: Record<string, unknown> = {
        customer_id: user.customerId,
        time_frame: params.time_frame || "6 months",
        min_purchase_count: params.min_purchase_count || 1,
        page: params.page || 1,
        page_size: params.page_size || 20,
        filterByBrand: filterByBrand,
        warehouse: params.warehouse || resolvedWarehouse,
      }
      if (params.sortByQty === "asc" || params.sortByQty === "desc") {
        baseBody.sortByQty = params.sortByQty
      }
      if (params.inStockOnly === true) baseBody.inStockOnly = 1
      if (params.inStockOnly === false) baseBody.inStockOnly = 0

      const body = mergeOrderitIntoBody(baseBody, settings, {
        sortByQty:
          params.sortByQty === "asc" || params.sortByQty === "desc" ? params.sortByQty : undefined,
        // Do not apply in-stock filter from portal settings on initial load; only when user explicitly sets it
        inStockOnlyOverride:
          params.inStockOnly === true ? true : params.inStockOnly === false ? false : undefined,
      })

      const extraParams = new URLSearchParams()
      if (params.inStockOnly === true) {
        extraParams.set("inStockOnly", "1")
        extraParams.set("warehouse", String(params.warehouse || resolvedWarehouse || ""))
        if (!(params.sortByQty === "asc" || params.sortByQty === "desc")) {
          extraParams.set("sortByRecommended", "1")
        }
      }
      const endpointWithParams = extraParams.toString() ? `${url}?${extraParams}` : url

      const response = await apiClient.request<any>(endpointWithParams, {
        method: "POST",
        body: JSON.stringify(body),
        auth: {
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          sid: user.sid,
        },
      })
      const items = response?.message?.items || response?.items || []
      console.log(`[MostBought API] POST ${url} - Status: ${response?.status || response?.message?.status || 'OK'} - Items: ${items.length}`)
      return response
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )
}

/** Formats YYYY-MM-DD to DD-MM-YYYY for API. */
function toApiDate(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return ""
  const [y, m, d] = isoDate.slice(0, 10).split("-")
  return [d, m, y].join("-")
}

export interface UseQuotationsParams {
  startDate?: string
  endDate?: string
}

export function useQuotations(params?: UseQuotationsParams) {
  const { user } = useAuth()
  const startDate = params?.startDate ?? ""
  const endDate = params?.endDate ?? ""

  const key = user ? ["quotations", user.email, user.customerId, startDate, endDate] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      const search = new URLSearchParams({
        owner: user.email,
      })
      if (user.customerId) {
        search.set("customer_name", user.customerId)
      }
      if (startDate) search.set("startDate", toApiDate(startDate))
      if (endDate) search.set("endDate", toApiDate(endDate))

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_all_quotations?${search}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      const msg = response?.message
      if (Array.isArray(msg)) return msg
      if (msg && typeof msg === "object" && Array.isArray((msg as any).quotations)) return (msg as any).quotations
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )
}

export function useQuotationDetails(quotationId: string | null) {
  const { user } = useAuth()

  const key = user && quotationId ? ["quotationDetails", quotationId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !quotationId) return null

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_quotation_details?quotation_id=${encodeURIComponent(
          quotationId
        )}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      return response?.message || null
    },
    {
      revalidateOnFocus: false,
    }
  )
}

export interface UseSalesPersonOrdersParams {
  page?: number
  pageSize?: number
  salesPerson?: string
  startDate?: string
  endDate?: string
}

export function useSalesPersonOrders(params?: UseSalesPersonOrdersParams) {
  const { user } = useAuth()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const salesPerson = params?.salesPerson ?? user?.salesPerson ?? ""
  const startDate = params?.startDate ?? ""
  const endDate = params?.endDate ?? ""

  const key = user
    ? ["salesPersonOrders", user.customerId, salesPerson, page, pageSize, startDate, endDate]
    : null

  return useSWR(
    key,
    async () => {
      if (!user) {
        return { total_sales_order_count: 0, sales_orders: [] }
      }

      const search = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      if (user.customerId) {
        search.set("customer_name", user.customerId)
      }
      if (salesPerson) {
        search.set("sales_person", salesPerson)
      }
      if (startDate) search.set("startDate", toApiDate(startDate))
      if (endDate) search.set("endDate", toApiDate(endDate))
      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_sales_person_orders?${search}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )
      const msg = response?.message
      if (!msg || typeof msg !== "object") return { total_sales_order_count: 0, sales_orders: [] }
      const orders = Array.isArray(msg.sales_orders) ? msg.sales_orders : []
      return {
        total_sales_order_count: msg.total_sales_order_count ?? orders.length,
        sales_orders: orders,
      }
    },
    { revalidateOnFocus: false }
  )
}

export function useOrderDetails(orderId: string | null) {
  const { user } = useAuth()

  const key = user && orderId ? ["orderDetails", orderId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !orderId) return null
      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_order_details?order_id=${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )
      return response?.message ?? null
    },
    { revalidateOnFocus: false }
  )
}

export function useCustomerDetails(customerId: string | null) {
  const { user } = useAuth()

  const key = user && customerId ? ["customerDetails", customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !customerId) return null
      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_customer_details?customer_id=${encodeURIComponent(customerId)}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )
      return response?.message ?? null
    },
    { revalidateOnFocus: false }
  )
}

type CustomerNameListRow = { name?: string; customer_name?: string }

const resolveCustomerDisplayName = (
  message: unknown,
  customerId: string
): string | null => {
  if (message == null) return null
  if (typeof message === "string") return message

  if (typeof message !== "object") return null
  const msg = message as Record<string, unknown>

  // Single-object shape: { customer_name: '...' }
  if (typeof msg.customer_name === "string" && msg.customer_name) {
    return msg.customer_name
  }

  // List API shape: { data: [{ name, customer_name }, ...] } (matches get_customer_names)
  const rawData = msg.data
  if (Array.isArray(rawData)) {
    const row = rawData.find(
      (item): item is CustomerNameListRow =>
        item != null &&
        typeof item === "object" &&
        "name" in item &&
        (item as CustomerNameListRow).name === customerId
    )
    if (row?.customer_name) return row.customer_name
  }

  return null
}

export function useCustomerName(customerId: string | null) {
  const { user } = useAuth()

  const key = user && customerId ? ["customerName", customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !customerId) return null

      const response = await apiClient.request<{ message?: unknown }>(
        `/api/method/prosessed_orderit.orderit.get_customer_names?customer_id=${encodeURIComponent(
          customerId
        )}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      return resolveCustomerDisplayName(response?.message, customerId)
    },
    { revalidateOnFocus: false }
  )
}

export interface UseTaggedItemsOptions {
  sortByQty?: "asc" | "desc"
  inStockOnly?: boolean | null
}

export function useTaggedItems(warehouse?: string, options?: UseTaggedItemsOptions) {
  const { user } = useAuth()
  const { data: warehousesData } = useWarehousesByCustomerBranch()
  const resolvedWarehouse = warehousesData?.default_warehouse || user?.defaultWarehouse || ""

  const key = user
    ? [
        "taggedItems",
        user.customerId,
        user.companyName,
        warehouse ?? resolvedWarehouse,
        options?.sortByQty,
        options?.inStockOnly,
      ]
    : null

  return useSWR(
    key,
    async () => {
      if (!user) return null
      const auth = { apiKey: user.apiKey, apiSecret: user.apiSecret, sid: user.sid }
      const settings = await fetchOrderitSettings(auth)

      const params = new URLSearchParams({
        customer: user.customerId,
        qty: "1.0",
        company: user.companyName || "",
        sortQtyField: "actual",
        warehouse: warehouse || resolvedWarehouse,
      })
      appendOrderitToSearchParams(params, settings, {
        sortByQty:
          options?.sortByQty === "asc" || options?.sortByQty === "desc"
            ? options.sortByQty
            : undefined,
        // Do not apply in-stock filter from portal settings on initial load; only when user explicitly sets it
        inStockOnlyOverride:
          options?.inStockOnly === true ? true : options?.inStockOnly === false ? false : undefined,
      })

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit_app.apis.quickaccess.tagged_items.tagged_items.get_items_with_tags_v2?${params}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      console.log(`[Tagged Items API] Response:`, response)
      const raw = response?.message
      const data = Array.isArray(raw) ? raw : (raw?.items ?? [])
      return Array.isArray(data) ? data : []
    },
    { revalidateOnFocus: false }
  )
}

export interface Banner {
  title: string
  subtitle?: string
  image_url: string
  redirect_url?: string | null
}

export interface Deal {
  title: string
  tag: string
  image_url: string
  redirect_url?: string | null
}

export interface AnnouncementPopupConfig {
  enabled?: boolean
  image_url?: string | null
  redirect_url?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface SocialHandlesConfig {
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  linkedin_url?: string | null
  youtube_url?: string | null
}
export interface BannersAndDealsResponse {
  company_logo?: string
  banners: Banner[]
  deals: Deal[]
  announcement_popup?: AnnouncementPopupConfig | null
  social_handles?: SocialHandlesConfig | null
  /**
   * Controls whether the backend should create a Sales Order vs a Quotation
   * when submitting the cart.
   */
  order_quote_logic?: {
    create_order?: number | null
    create_quote?: number | null
  } | null
}

export function useBannersAndDeals() {
  const { user, isLoading: authLoading } = useAuth()

  // Session + company in the key so SWR does not reuse a stale cache after login
  // or when switching tenant (was showing defaults until manual refresh).
  const swrKey =
    authLoading
      ? null
      : (["bannersAndDeals", user?.sid ?? "guest", user?.companyUrl ?? ""] as const)

  const swr = useSWR(
    swrKey,
    async () => {
      try {
        const response = await apiClient.request<any>(
          "/api/method/prosessed_order.api.get_b2b_banners_and_deals",
          {
            method: "POST",
            body: JSON.stringify({}),
            ...(user
              ? {
                  auth: {
                    apiKey: user.apiKey,
                    apiSecret: user.apiSecret,
                    sid: user.sid,
                  },
                }
              : {}),
          }
        )

        const data = response?.message || response
        return data as BannersAndDealsResponse
      } catch (error) {
        console.error("[useBannersAndDeals] Failed to load banners and deals:", error)
        return {
          company_logo: undefined,
          banners: [],
          deals: [],
          announcement_popup: null,
          social_handles: null,
          // Default to existing behavior: quotations.
          order_quote_logic: { create_order: 0, create_quote: 1 },
        } as BannersAndDealsResponse
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return {
    ...swr,
    isLoading: authLoading || swr.isLoading,
  }
}

/** `customerName` must be ERPNext `Customer.customer_name` (see `useCustomerName`), not document `name`. */
export function useCustomerStatement(
  customerName: string | null,
  startDate: string | null,
  endDate: string | null
) {
  const key =
    customerName && startDate && endDate
      ? ["statement", customerName, startDate, endDate]
      : null

  return useSWR(
    key,
    async () => {
      if (!customerName || !startDate || !endDate) return null

      try {
        return await apiClient.getCustomerStatementUrl(customerName, startDate, endDate)
      } catch (error) {
        console.error("Error fetching statement URL:", error)
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )
}

export interface PaginationInfo {
  total_records?: number
  has_next_page?: boolean
}

export interface UseAllInvoicesParams {
  page?: number
  pageSize?: number
  customerId?: string | null
}

export interface ReturnRequestItem {
  item_code?: string
  item_name?: string
  item_group?: string
  qty?: number
  quantity?: number
  rate?: number
  amount?: number
  uom?: string
}

export interface ReturnRequestCreditNote {
  invoice_id?: string
  posting_date?: string
  due_date?: string
  grand_total?: number
  outstanding_amount?: number
  currency?: string
  status?: string
}

export interface ReturnRequest {
  name?: string
  return_request_id?: string
  customer_id?: string
  customer_name?: string
  date_of_request?: string
  reason_for_return?: string
  return_for_invoice_no?: string
  credit_note?: ReturnRequestCreditNote | null
  items?: ReturnRequestItem[]
  products?: ReturnRequestItem[]
}

export interface ReturnRequestsPagination {
  total_records?: number
  page_size?: number
  current_page?: number
  total_pages?: number
  has_next_page?: boolean
  has_previous_page?: boolean
  start_index?: number
  end_index?: number
}

export interface UseReturnRequestsParams {
  customerId?: string | null
  page?: number
  pageSize?: number
}

export interface CreateSalesOrderReturnProductInput {
  item_code: string
  item_name: string
  quantity: number
  uom: string
}

export interface CreateSalesOrderReturnInput {
  customerName: string
  returnForInvoiceNo?: string | null
  reasonForReturn: string
  dateOfRequest: string
  products: CreateSalesOrderReturnProductInput[]
  photos?: File[]
  customerSignature?: File | null
}

export interface CreateSalesOrderReturnResponse {
  status?: string
  message?: string
  return_request_name?: string
  customer_name?: string
  attachments?: string[]
  customer_signature?: string
}

export function useAllInvoices(params?: UseAllInvoicesParams) {
  const { user } = useAuth()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const customerId = params?.customerId ?? user?.customerId ?? null

  const key = user ? ["allInvoices", customerId, page, pageSize, user.apiKey] : null

  return useSWR(
    key,
    async () => {
      if (!user) return { invoices: [], pagination: {} as PaginationInfo }

      const search = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      })
      if (customerId) search.set("customer_id", customerId)

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_all_invoices?${search.toString()}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      const raw = response?.message ?? response
      const invoices =
        (Array.isArray(raw?.invoices) && raw.invoices) ||
        (Array.isArray(raw?.items) && raw.items) ||
        (Array.isArray(raw) && raw) ||
        []

      const totalRecords =
        typeof raw?.pagination?.total_records === "number"
          ? raw.pagination.total_records
          : typeof raw?.total_records === "number"
            ? raw.total_records
          : typeof raw?.totalRecords === "number"
            ? raw.totalRecords
            : typeof raw?.total === "number"
              ? raw.total
              : typeof response?.total_records === "number"
                ? response.total_records
                : undefined

      const hasNextPage =
        typeof raw?.pagination?.has_next_page === "boolean"
          ? raw.pagination.has_next_page
          : typeof totalRecords === "number"
            ? page * pageSize < totalRecords
          : typeof raw?.has_next_page === "boolean"
            ? raw.has_next_page
            : undefined

      const pagination: PaginationInfo = {
        total_records: totalRecords,
        has_next_page: hasNextPage,
      }

      return { invoices, pagination }
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )
}

export function useReturnRequests(params?: UseReturnRequestsParams) {
  const { user } = useAuth()
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const customerId = params?.customerId ?? user?.customerId ?? null

  const key = user && customerId ? ["returnRequests", customerId, page, pageSize, user.apiKey] : null

  return useSWR(
    key,
    async () => {
      if (!user || !customerId) {
        return {
          return_requests: [] as ReturnRequest[],
          pagination: {} as ReturnRequestsPagination,
        }
      }

      const search = new URLSearchParams({
        customer_id: customerId,
        page: String(page),
        page_size: String(pageSize),
      })

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_return_requests_list?${search.toString()}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      const raw = response?.message ?? response

      return {
        return_requests: Array.isArray(raw?.return_requests) ? raw.return_requests : [],
        pagination:
          raw?.pagination && typeof raw.pagination === "object"
            ? (raw.pagination as ReturnRequestsPagination)
            : ({} as ReturnRequestsPagination),
      }
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )
}

export async function createSalesOrderReturn(
  input: CreateSalesOrderReturnInput,
  auth?: { apiKey?: string | null; apiSecret?: string | null; sid?: string | null }
): Promise<CreateSalesOrderReturnResponse> {
  const formData = new FormData()
  const customerName = String(input.customerName ?? "").trim()
  if (!customerName) {
    throw new Error("Missing required field: customer_name")
  }
  formData.append("customer_name", customerName)
  const invoiceNo = String(input.returnForInvoiceNo ?? "").trim()
  if (invoiceNo) {
    formData.append("return_for_invoice_no", invoiceNo)
  }
  formData.append("reason_for_return", input.reasonForReturn)
  formData.append("date_of_request", input.dateOfRequest)
  formData.append("products", JSON.stringify(input.products))

  
  for (const photo of input.photos ?? []) {
    formData.append("photos", photo)
  }

  if (input.customerSignature) {
    formData.append("customer_signature", input.customerSignature)
  }

  const candidateEndpoints = [
    "/api/method/prosessed_orderit.orderit.create_sales_order_return",
  ]

  let lastError: unknown = null

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await apiClient.request<{ message?: CreateSalesOrderReturnResponse }>(endpoint, {
        method: "POST",
        body: formData,
        auth,
      })

      const result = (response?.message ?? response) as CreateSalesOrderReturnResponse
      if (result?.status === "error") {
        throw new Error(result.message || "Failed to create return request.")
      }

      return result
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to create return request.")
}

export function useInvoiceDetails(invoiceId: string | null) {
  const { user } = useAuth()

  const key = user && invoiceId ? ["invoiceDetails", invoiceId, user.apiKey] : null

  return useSWR(
    key,
    async () => {
      if (!user || !invoiceId) return null

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_invoice_details?invoice_id=${encodeURIComponent(invoiceId)}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      return response?.message ?? null
    },
    { revalidateOnFocus: false }
  )
}
