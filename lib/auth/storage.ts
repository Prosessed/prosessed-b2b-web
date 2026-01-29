import type { AuthUser } from "./types" // Fixing relative import to use correct types file
import { cookies } from "next/headers"

const AUTH_STORAGE_KEY = "prosessed_auth"
const SESSION_STORAGE_KEY = "prosessed_session"
const AUTH_COOKIE_KEY = "prosessed_auth_session"

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

/**
 * Server-side function to retrieve authenticated user session from cookies
 * Used in Server Components and API routes
 */
export async function getAuthSession(): Promise<{ user: AuthUser } | null> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(AUTH_COOKIE_KEY)

    if (!authCookie?.value) {
      return null
    }

    const user = JSON.parse(authCookie.value) as AuthUser
    return { user }
  } catch (error) {
    console.error("[getAuthSession] Failed to retrieve session:", error)
    return null
  }
}

/**
 * Server-side function to set authenticated user session in cookies
 * Called after successful login
 */
export async function setAuthSession(user: AuthUser): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_KEY, JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
  } catch (error) {
    console.error("[setAuthSession] Failed to set session:", error)
  }
}

/**
 * Server-side function to clear authenticated user session from cookies
 */
export async function clearAuthSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(AUTH_COOKIE_KEY)
  } catch (error) {
    console.error("[clearAuthSession] Failed to clear session:", error)
  }
}
