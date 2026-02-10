"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Lock, Building2 } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api/client"
import { setAuthCookie } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"
import type { Company, AuthUser } from "@/lib/auth/types"

export default function PasswordPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState<Company | null>(null)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("login_email")
    const storedCompany = sessionStorage.getItem("login_company")

    if (!storedEmail || !storedCompany) {
      router.push("/login")
      return
    }

    setEmail(storedEmail)
    setCompany(JSON.parse(storedCompany))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setError("")
    setIsLoading(true)

    try {
      const response = await apiClient.login(email, password, company.company_url)

      const user: AuthUser = {
        email: response.message.email,
        fullName: response.full_name,
        username: response.message.username,
        companyName: response.message.company ?? company.company_name,
        salesPerson: response.message.sales_person ?? "",
        apiKey: response.message.api_key,
        apiSecret: response.message.api_secret,
        sid: response.message.sid,
        customerId: response.message.customer_id,
        isCustomer: response.message.is_customer,
        defaultWarehouse: response.message.default_warehouse,
        defaultPaymentTerm: response.message.default_payment_term,
        defaultCurrency: response.message.default_currency,
        companyUrl: company.company_url,
        disablePriceEdit: response.message.company_custom_disable_price_edit === 1,
        disableDiscountApply: response.message.company_custom_disable_discount_apply === 1,
      }

      login(user)
      await setAuthCookie(user)
      sessionStorage.removeItem("login_email")
      sessionStorage.removeItem("login_company")
      router.push("/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Login failed. Please check your password and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!company) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Enter Password</CardTitle>
          <CardDescription className="text-base">{company.company_name}</CardDescription>
          <div className="text-sm text-muted-foreground pt-1">{email}</div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/login")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to company selection
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
