"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, Mail } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api/client"
import type { Company } from "@/lib/auth/types"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "company">("email")
  const [email, setEmail] = useState("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const companiesData = await apiClient.getCompaniesByEmail(email)

      if (companiesData.length === 0) {
        setError("No companies found for this email address")
        setIsLoading(false)
        return
      }

      setCompanies(companiesData)
      setStep("company")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Failed to fetch companies. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySelect = (company: Company) => {
    // Store email and company in sessionStorage for the password page
    sessionStorage.setItem("login_email", email)
    sessionStorage.setItem("login_company", JSON.stringify(company))
    router.push("/login/password")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
              P
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            {step === "email" ? "Enter your email to get started" : "Select your company"}
          </CardDescription>
        </CardHeader>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                    disabled={isLoading}
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
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground pt-4">
                New to prosessed.ai?{" "}
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  Contact Sales
                </Link>
              </p>
            </CardContent>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {companies.map((company, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full p-4 text-left border border-border/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-base group-hover:text-primary transition-colors">
                        {company.company_name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{company.company_url}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-6"
              onClick={() => {
                setStep("email")
                setCompanies([])
                setError("")
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
