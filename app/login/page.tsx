"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#000000]">
      <Card className="w-full max-w-md border-none bg-transparent shadow-none">
        <CardHeader className="space-y-4 text-center pb-12">
          <div className="mx-auto w-16 h-16 bg-[#000000] border border-[#1a1a1a] rounded-full flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 bg-[#008000] rounded-full flex items-center justify-center text-white text-xl font-bold">
              P
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-white tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-[#808080] text-lg font-medium">
            {step === "email" ? "Enter your email to get started" : "Select your company"}
          </CardDescription>
        </CardHeader>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit}>
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
                    className="pl-10 h-14 bg-[#111111] border-[#222222] text-white text-lg placeholder:text-[#444444] focus:ring-0 focus:border-[#008000] transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 bg-[#008000] hover:bg-[#006400] text-white text-lg font-semibold rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {companies.map((company, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full p-6 text-left bg-[#111111] border border-[#222222] rounded-2xl hover:border-[#008000]/50 hover:bg-[#1a1a1a] transition-all group"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg text-white group-hover:text-[#008000] transition-colors">
                        {company.company_name}
                      </div>
                      <div className="text-sm text-[#808080] font-mono opacity-80">
                        {company.company_url.replace(/\/$/, "")}
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-[#444444] group-hover:text-[#008000] group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-8 text-[#808080] hover:text-white hover:bg-transparent text-base font-medium"
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
