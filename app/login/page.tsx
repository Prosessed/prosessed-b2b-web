"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight, Mail } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api/client"
import type { Company } from "@/lib/auth/types"
import Link from "next/link"

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <header className="relative z-10 container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            P
          </div>
          <span>prosessed.ai</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            About Us
          </Link>
          <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Products
          </Link>
          <Button
            variant="outline"
            className="rounded-full border-primary/20 text-primary hover:bg-primary/5 bg-transparent"
          >
            Contact
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Powered by AI — Master your Digital Landscape
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl mb-6">
          AI-First <span className="text-primary">Operating System</span> for <br className="hidden md:block" />
          Cross Border Trade Optimizing <span className="text-primary/70 italic">Cash Flow.</span>
        </h1>

        <div className="w-full max-w-md mt-12 bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground">
              {step === "email" ? "Enter your email to access your business portal" : "Select your business entity"}
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
                      Checking...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground pt-4">
                  This portal is powered by <span className="font-bold text-foreground">prosessed.ai</span>
                </p>
              </CardContent>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-primary/10">
                {companies.map((company, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCompanySelect(company)}
                    className="w-full p-5 text-left bg-muted/30 border border-border/50 rounded-2xl hover:border-primary/50 hover:bg-muted/50 transition-all group flex items-center justify-between"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {company.company_name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {company.company_name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {company.company_url.replace(/https?:\/\//, "").replace(/\/$/, "")}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("email")
                  setCompanies([])
                  setError("")
                }}
              >
                Use a different email
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 container mx-auto px-4 h-20 flex items-center justify-center border-t border-border/10">
        <p className="text-sm text-muted-foreground">© 2025 prosessed.ai — The AI-First Operating System for Trade.</p>
      </footer>
    </div>
  )
}
