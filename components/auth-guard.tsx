"use client"

import { useAuth } from "@/lib/auth/context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { Building } from "lucide-react"

const PUBLIC_ROUTES = ["/login", "/login/password", "/contact", "/privacy", "/terms"]

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <Building className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading session...</p>
        </div>
      </div>
    )
  }

  // Allow access to public routes or authenticated users
  if (isAuthenticated || PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>
  }

  return null
}
