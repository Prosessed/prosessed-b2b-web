"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { setApiBaseUrl, setUnauthorizedHandler } from "../api/client"
import { validateOrderitSession } from "../api/orderit-settings"
import { clearAuthCookie, setAuthCookie } from "./actions"
import { authStorage } from "./storage.client"
import type { AuthUser } from "./types"

const LOGIN_PATH = "/login"

const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/contact",
  "/privacy",
  "/terms",
]

const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTE_PREFIXES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (user: AuthUser) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cookieSyncedRef = useRef(false)

  const handleSessionExpired = useCallback(async () => {
    setUser(null)
    authStorage.removeUser()
    cookieSyncedRef.current = false
    await clearAuthCookie().catch(() => {})

    if (typeof window !== "undefined" && !isPublicRoute(window.location.pathname)) {
      window.location.href = LOGIN_PATH
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void handleSessionExpired()
    })
    return () => setUnauthorizedHandler(null)
  }, [handleSessionExpired])

  useEffect(() => {
    let cancelled = false

    const initAuth = async () => {
      const storedUser = authStorage.getUser()

      if (storedUser && authStorage.isSessionValid(storedUser.sid)) {
        setApiBaseUrl(storedUser.companyUrl)

        const sessionValid = await validateOrderitSession({
          apiKey: storedUser.apiKey,
          apiSecret: storedUser.apiSecret,
          sid: storedUser.sid,
        })

        if (cancelled) return

        if (!sessionValid) {
          await handleSessionExpired()
          setIsLoading(false)
          return
        }

        setUser(storedUser)
        if (!cookieSyncedRef.current) {
          cookieSyncedRef.current = true
          setAuthCookie(storedUser).catch(() => {})
        }
      } else if (storedUser) {
        authStorage.removeUser()
        setUser(null)
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    void initAuth()

    return () => {
      cancelled = true
    }
  }, [handleSessionExpired])

  const login = (userData: AuthUser) => {
    setApiBaseUrl(userData.companyUrl)
    setUser(userData)
    authStorage.setUser(userData)
    authStorage.setSession(userData.sid)
  }

  const logout = () => {
    setUser(null)
    authStorage.removeUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
