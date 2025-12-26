"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authStorage } from "./storage"
import type { AuthUser } from "./types"

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

  useEffect(() => {
    const storedUser = authStorage.getUser()
    if (storedUser) {
      if (authStorage.isSessionValid(storedUser.apiSecret)) {
        setUser(storedUser)
      } else {
        authStorage.removeUser()
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: AuthUser) => {
    setUser(userData)
    authStorage.setUser(userData)
    authStorage.setSession(userData.apiSecret)
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
