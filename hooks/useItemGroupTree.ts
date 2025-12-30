"use client"

import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/context"
import useSWR from "swr"

export interface ItemGroupNode {
  value: string
  title: string
  label?: string // Alias for title for backward compatibility
  expandable: number
  image?: string
  custom_priority_rank?: number | string | null
  children?: ItemGroupNode[]
}

export function useItemGroupTree(includeDisabled = false) {
  const { user } = useAuth()
  const key = user ? ["item-group-tree", includeDisabled, user.customerId] : null

  return useSWR<ItemGroupNode[]>(
    key,
    async () => {
      if (!user) return []

      const response = await apiClient.request<{ message: ItemGroupNode[] }>(
        `/api/method/prosessed_orderit.orderit.get_complete_item_group_tree?include_disabled=${includeDisabled}`,
        {
          method: "GET",
          auth: {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret,
            sid: user.sid,
          },
        },
      )
      
      // Extract the message array from the response and map title to label for compatibility
      const items = response.message || []
      return items.map((item) => ({
        ...item,
        label: item.title || item.value, // Use title as label for backward compatibility
      }))
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )
}