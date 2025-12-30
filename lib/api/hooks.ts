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

export function useSearch(term: string) {
  const { user } = useAuth()

  const key = user && term && term.length >= 2 ? ["search", term, user.customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      return apiClient.request<any>("/api/method/prosessed_orderit.orderit.search_items", {
        method: "POST",
        body: JSON.stringify({
          search_key: term,
          customer: user.customerId,
          warehouse: user.defaultWarehouse,
          include_item_details: true,
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
      dedupingInterval: 300,
    },
  )
}
