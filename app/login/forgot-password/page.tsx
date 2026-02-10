"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight, Mail, Lock, ArrowLeft, Building2 } from "lucide-react"
import { requestOTP, verifyOtpAndResetPassword } from "@/lib/api/auth"
import Link from "next/link"

const LOGIN_EMAIL_KEY = "login_email"
const LOGIN_COMPANY_KEY = "login_company"

function clearLoginSession() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(LOGIN_EMAIL_KEY)
  sessionStorage.removeItem(LOGIN_COMPANY_KEY)
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState<{ company_name: string; company_url: string } | null>(null)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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
      setCompany(JSON.parse(storedCompany) as { company_name: string; company_url: string })
    } catch {
      router.replace("/login")
      return
    }
    setReady(true)
  }, [router])

  const companyUrl = company?.company_url ?? null

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyUrl) return
    setError("")
    setIsLoading(true)
    try {
      await requestOTP(email, companyUrl)
      setStep("otp")
      setSuccessMessage("OTP has been sent to your email address")
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpAndResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (otp.length < 4) {
      setError("Please enter a valid OTP")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    setIsLoading(true)
    try {
      await verifyOtpAndResetPassword(email, otp, newPassword, companyUrl)
      setSuccessMessage("Password has been reset successfully. Redirecting to login...")
      clearLoginSession()
      setTimeout(() => router.push("/login"), 1500)
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP, or failed to reset. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === "otp") {
      setError("")
      setOtp("")
      setStep("email")
    } else {
      clearLoginSession()
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Recover Your Account
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl mb-6">
          Reset Your <span className="text-primary">Password</span>
        </h1>

        <div className="w-full max-w-md mt-12 bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">
              {step === "email" && "Send OTP"}
              {step === "otp" && "Verify OTP & Set New Password"}
            </h2>
            <p className="text-muted-foreground">
              {step === "email" && "We'll send a one-time password to your email for this company"}
              {step === "otp" && `Enter the OTP sent to ${email} and your new password`}
            </p>
          </div>

          {!ready ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                      <p className="font-semibold text-sm truncate">{company?.company_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {company?.company_url?.replace(/^https?:\/\//, "").replace(/\/app\/?.*$/, "").replace(/\/$/, "")}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handleOtpAndResetSubmit} className="space-y-4">
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all text-center text-xl tracking-widest"
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#808080]" />
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-12 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#808080]" />
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-2xl">
                    {successMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-primary/20"
                  disabled={isLoading || otp.length < 4 || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Verify OTP & Reset Password"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    clearLoginSession()
                    router.push("/login")
                  }}
                  disabled={isLoading}
                >
                  Use different email or company
                </Button>
              </CardContent>
            </form>
          )}

          {ready && (
            <div className="mt-6">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {step === "email" ? "Back to login" : "Back"}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 container mx-auto px-4 h-20 flex items-center justify-center border-t border-border/10">
        <p className="text-sm text-muted-foreground">© 2025 B2B Commerce</p>
      </footer>
    </div>
  )
}
