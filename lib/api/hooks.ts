"use client"

import useSWR from "swr"
import { apiClient } from "./client"
import { useAuth } from "@/lib/auth/context"

export interface UseItemsParams {
  item_group?: string
  page?: number
  page_size?: number
  search_term?: string
  is_search?: boolean
  sortByQty?: "asc" | "desc"
  filterByBrand?: string | string[]
  inStockOnly?: boolean
  qty?: number
}

export function useItems(params: UseItemsParams) {
  const { user } = useAuth()

  const key = user ? ["items", params, user.customerId, user.defaultWarehouse] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      // Format filterByBrand - can be array or string
      let filterByBrand: string | string[] | undefined = params.filterByBrand
      if (Array.isArray(filterByBrand) && filterByBrand.length === 0) {
        filterByBrand = undefined
      }

      return apiClient.request<any>("/api/method/prosessed_orderit.orderit.get_items_from_item_group_vtwo", {
        method: "POST",
        body: JSON.stringify({
          item_group: params.item_group,
          customer: user.customerId,
          warehouse: user.defaultWarehouse,
          company: user.companyName,
          page: params.page || 1,
          page_size: params.page_size || 20,
          search_term: params.search_term,
          is_search: params.is_search || false,
          sortByQty: params.sortByQty || "asc",
          filterByBrand: filterByBrand,
          inStockOnly: params.inStockOnly ? 1 : 0,
          qty: params.qty || 1.0,
        }),
        auth: {
          apiKey: user.apiKey,
          apiSecret: user.apiSecret,
          sid: user.sid,
        },
      })
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
}

export function useSearch(term: string, page: number = 1, pageSize: number = 10) {
  const { user } = useAuth()

  const key = user && term && term.length >= 2 ? ["search", term, page, pageSize, user.customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !term || term.length < 2) return null

      const requestBody = {
        search_key: term,
        customer: user.customerId,
        warehouse: user.defaultWarehouse,
        company: user.companyName,
        include_item_details: true,
        page: page,
        page_size: pageSize,
      }

      console.log(`[Search API] Request:`, requestBody)

      const response = await apiClient.request<any>("/api/method/prosessed_orderit.orderit.search_items", {
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
  inStockOnly?: boolean
  warehouse?: string
}

export function useItemDetails(itemCode: string | null, qty: number = 1) {
  const { user } = useAuth()

  // Don't include qty in key to avoid refetching on quantity change - price calculation happens client-side
  const key = user && itemCode ? ["itemDetails", itemCode, user.customerId, user.defaultWarehouse] : null

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
          warehouse: user.defaultWarehouse,
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

  const key = user && params ? ["mostBought", params, user.customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user || !params) return null

      let filterByBrand: string | string[] | undefined = params.filterByBrand
      if (Array.isArray(filterByBrand) && filterByBrand.length === 0) {
        filterByBrand = undefined
      }

      const url = "/api/method/prosessed_orderit.orderit.get_most_bought_items_vtwo"
      const response = await apiClient.request<any>(url, {
        method: "POST",
        body: JSON.stringify({
          customer_id: user.customerId,
          time_frame: params.time_frame || "6 months",
          min_purchase_count: params.min_purchase_count || 1,
          page: params.page || 1,
          page_size: params.page_size || 20,
          sortByQty: params.sortByQty,
          filterByBrand: filterByBrand,
          inStockOnly: params.inStockOnly ? 1 : 0,
          warehouse: params.warehouse || user.defaultWarehouse,
        }),
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

export function useQuotations() {
  const { user } = useAuth()

  const key = user ? ["quotations", user.email] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      const response = await apiClient.request<any>(
        `/api/method/prosessed_orderit.orderit.get_all_quotations?owner=${encodeURIComponent(user.email)}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        }
      )

      return response?.message || []
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

export interface BannersAndDealsResponse {
  banners: Banner[]
  deals: Deal[]
}

export function useBannersAndDeals() {
  const key = "bannersAndDeals"

  return useSWR(
    key,
    async () => {
      const response = await apiClient.request<any>(
        "/api/method/prosessed_order.api.get_b2b_banners_and_deals",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )

      const data = response?.message || response
      return data as BannersAndDealsResponse
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )
}
