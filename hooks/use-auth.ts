"use client"

import { AuthResponse } from "@/lib/auth/types"
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface UserProfile {
  username: string
  email: string
  full_name: string
  customer_id: string
  default_warehouse: string
  default_currency: string
}

interface AuthState {
  user: UserProfile | null
  sid: string | null
  apiKey: string | null
  apiSecret: string | null
  isAuthenticated: boolean
  setAuth: (response: AuthResponse) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sid: null,
      apiKey: null,
      apiSecret: null,
      isAuthenticated: false,
      setAuth: (response: AuthResponse) => {
        const { message } = response
        set({
          user: {
            username: message.username,
            email: message.email,
            full_name: response.full_name,
            customer_id: message.customer_id,
            default_warehouse: message.default_warehouse,
            default_currency: message.default_currency,
          },
          sid: message.sid,
          apiKey: message.api_key,
          apiSecret: message.api_secret,
          isAuthenticated: true,
        })
      },
      logout: () => {
        set({
          user: null,
          sid: null,
          apiKey: null,
          apiSecret: null,
          isAuthenticated: false,
        })
        // Redirect to login handled by components or middleware
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
