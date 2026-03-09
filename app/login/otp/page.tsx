"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail, Building2 } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api/client"
import { setAuthCookie } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"
import { mapLoginResponseToAuthUser } from "@/lib/auth/utils"
import type { Company } from "@/lib/auth/types"

const LOGIN_EMAIL_KEY = "login_email"
const LOGIN_COMPANY_KEY = "login_company"

export default function LoginOtpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState<Company | null>(null)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem(LOGIN_EMAIL_KEY)
    const storedCompany = sessionStorage.getItem(LOGIN_COMPANY_KEY)
    if (!storedEmail || !storedCompany) {
      router.replace("/login")
      return
    }
    try {
      setEmail(storedEmail)
      setCompany(JSON.parse(storedCompany) as Company)
    } catch {
      router.replace("/login")
      return
    }
    setReady(true)
  }, [router])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    const trimmedOtp = otp.replace(/\D/g, "").slice(0, 6)
    if (trimmedOtp.length < 4) {
      setError("Please enter a valid OTP (4–6 digits)")
      return
    }
    setError("")
    setSuccessMessage("")
    setIsLoading(true)
    try {
      const response = await apiClient.loginWithOtp(email, trimmedOtp, company.company_url)
      const user = mapLoginResponseToAuthUser(response, company)
      login(user)
      await setAuthCookie(user)
      sessionStorage.removeItem(LOGIN_EMAIL_KEY)
      sessionStorage.removeItem(LOGIN_COMPANY_KEY)
      router.push("/")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Login failed. Please check the OTP and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!company) return
    setError("")
    setSuccessMessage("")
    setIsResending(true)
    try {
      const res = await apiClient.resendLoginOtp(email, company.company_url)
      setSuccessMessage(res.message || "New OTP sent")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to resend OTP. Please try again.")
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleBack = () => {
    router.push("/login/password")
  }

  if (!ready || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full max-w-md mt-12 bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Verify OTP</h2>
            <p className="text-muted-foreground">
              Enter the OTP sent to {email}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="relative flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <Building2 className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="font-semibold text-sm truncate">{company.company_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.company_url?.replace(/^https?:\/\//, "").replace(/\/app\/?.*$/, "").replace(/\/$/, "")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">OTP</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all text-center text-xl tracking-widest"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  aria-label="One-time password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  {successMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-primary/20"
                disabled={isLoading || otp.replace(/\D/g, "").length < 4}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleResendOtp}
                disabled={isLoading || isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to password
              </Button>
            </CardContent>
          </form>
        </div>
      </main>
    </div>
  )
}
