import type { AuthUser } from "./types" // Fixing relative import to use correct types file

const AUTH_STORAGE_KEY = "prosessed_auth"
const SESSION_STORAGE_KEY = "prosessed_session"

export const authStorage = {
  getUser: (): AuthUser | null => {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  setUser: (user: AuthUser) => {
    if (typeof window === "undefined") return
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  },

  removeUser: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  },

  getSession: (): { apiSecret: string } | null => {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  setSession: (apiSecret: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ apiSecret }))
  },

  isSessionValid: (currentApiSecret: string): boolean => {
    const session = authStorage.getSession()
    return session ? session.apiSecret === currentApiSecret : false
  },
}
