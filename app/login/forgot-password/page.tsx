"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight, Mail, Lock, ArrowLeft } from "lucide-react"
import { requestOTP, verifyOTP, resetPassword } from "@/lib/api/auth"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp" | "reset">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await requestOTP(email)
      setOtpSent(true)
      setStep("otp")
      setSuccessMessage(`OTP sent to ${email}`)
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 4) {
      setError("Please enter a valid OTP")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const result = await verifyOTP(email, otp)
      setResetToken(result.token)
      setStep("reset")
      setSuccessMessage("OTP verified successfully")
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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
      await resetPassword(email, resetToken, newPassword)
      setSuccessMessage("Password reset successfully!")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === "otp" || step === "reset") {
      setError("")
      setOtp("")
      setStep("email")
      setOtpSent(false)
    } else {
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
              {step === "email" && "Enter Your Email"}
              {step === "otp" && "Verify OTP"}
              {step === "reset" && "Create New Password"}
            </h2>
            <p className="text-muted-foreground">
              {step === "email" && "We'll send you a one-time password to reset your password"}
              {step === "otp" && `We've sent an OTP to ${email}`}
              {step === "reset" && "Enter your new password"}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#808080]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
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
          ) : step === "otp" ? (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="0000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-14 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all text-center text-2xl tracking-widest"
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Check your email for the OTP
                  </p>
                </div>

                {error && (
                  <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-primary/20"
                  disabled={isLoading || otp.length < 4}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("email")}
                  disabled={isLoading}
                >
                  Use a different email
                </Button>
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#808080]" />
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
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
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
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
                  <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-2xl">
                    {successMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl transition-all shadow-lg shadow-primary/20"
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </CardContent>
            </form>
          )}

          {step !== "reset" && (
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
        <p className="text-sm text-muted-foreground">© 2025 prosessed.ai — The AI-First Operating System for Trade.</p>
      </footer>
    </div>
  )
}
