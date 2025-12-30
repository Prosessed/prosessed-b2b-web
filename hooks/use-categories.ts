"use client"

import useSWR from "swr"
import { useAuth } from "@/lib/auth/context"
import { apiClient } from "@/lib/api/client"

export interface Category {
  name: string
  image: string
  item_group: string
}

export function useCategories() {
  const { user } = useAuth()

  const key = user ? ["categories", user.customerId] : null

  return useSWR(
    key,
    async () => {
      if (!user) return null

      return apiClient.request<any>(
        "/api/method/prosessed_orderit.orderit.get_item_gro",
        {
          method: "POST",
          body: JSON.stringify({
            customer: user.customerId,
          }),
        },
      )
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )
}
