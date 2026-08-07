"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, Mail, Smartphone } from "lucide-react"
import { apiClient, ApiError } from "@/lib/api/client"
import type { Company } from "@/lib/auth/types"
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_ISO2 } from "@/lib/constants/countries"
import { toE164, isValidMobileNumber } from "@/lib/utils/phone"
import Link from "next/link"

const LOGIN_EMAIL_KEY = "login_email"
const LOGIN_MOBILE_KEY = "login_mobile"
const LOGIN_COMPANY_KEY = "login_company"

type LoginTab = "email" | "mobile"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"entry" | "company">("entry")
  const [activeTab, setActiveTab] = useState<LoginTab>("email")

  // Email flow state (unchanged behavior)
  const [email, setEmail] = useState("")

  // Mobile flow state
  const [countryIso2, setCountryIso2] = useState(DEFAULT_COUNTRY_ISO2)
  const [localNumber, setLocalNumber] = useState("")
  const [mobileE164, setMobileE164] = useState("")

  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTabChange = (value: string) => {
    setActiveTab(value as LoginTab)
    setError("")
  }

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

      if (companiesData.length === 1) {
        sessionStorage.setItem(LOGIN_EMAIL_KEY, email)
        sessionStorage.setItem(LOGIN_COMPANY_KEY, JSON.stringify(companiesData[0]))
        router.push("/login/password")
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

  const proceedWithMobileCompany = async (mobileValue: string, company: Company) => {
    setError("")
    setIsLoading(true)
    try {
      await apiClient.requestMobileOtp(mobileValue, company.company_url)
      sessionStorage.setItem(LOGIN_MOBILE_KEY, mobileValue)
      sessionStorage.setItem(LOGIN_COMPANY_KEY, JSON.stringify(company))
      router.push("/login/mobile-otp")
    } catch (err) {
      if (err instanceof ApiError && err.message) {
        setError(err.message)
      } else {
        setError("Failed to send OTP. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const country = COUNTRY_DIAL_CODES.find((c) => c.iso2 === countryIso2)
    const e164 = toE164(country?.dialCode ?? "", localNumber)

    if (!isValidMobileNumber(e164)) {
      setError("Please enter a valid mobile number")
      return
    }

    setIsLoading(true)

    try {
      const companiesData = await apiClient.getCompaniesByMobile(e164)

      if (companiesData.length === 0) {
        setError("No companies found for this mobile number")
        setIsLoading(false)
        return
      }

      if (companiesData.length === 1) {
        await proceedWithMobileCompany(e164, companiesData[0])
        return
      }

      setMobileE164(e164)
      setCompanies(companiesData)
      setStep("company")
      setIsLoading(false)
    } catch (err) {
      if (err instanceof ApiError && err.message) {
        setError(err.message)
      } else {
        setError("Failed to fetch companies. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleCompanySelect = (company: Company) => {
    if (activeTab === "mobile") {
      void proceedWithMobileCompany(mobileE164, company)
      return
    }
    sessionStorage.setItem(LOGIN_EMAIL_KEY, email)
    sessionStorage.setItem(LOGIN_COMPANY_KEY, JSON.stringify(company))
    router.push("/login/password")
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mb-3">
          B2B Ordering Portal for Retailers
        </h1>
        <p className="text-muted-foreground text-lg mb-10">
          Place Order · Get Quote · Ledger · Payment
        </p>

        <div className="w-full max-w-md mt-12 bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-muted-foreground">
              {step === "company"
                ? "Select your business entity"
                : activeTab === "email"
                  ? "Enter your email to access your business portal"
                  : "Enter your mobile number to access your business portal"}
            </p>
          </div>

          {step === "entry" ? (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <CardContent className="space-y-6 px-0">
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

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      New to the portal?{" "}
                      <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </form>
              </TabsContent>

              <TabsContent value="mobile">
                <form onSubmit={handleMobileSubmit} className="space-y-4">
                  <CardContent className="space-y-6 px-0">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Select value={countryIso2} onValueChange={setCountryIso2} disabled={isLoading}>
                          <SelectTrigger className="h-14 w-[128px] shrink-0 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_DIAL_CODES.map((c) => (
                              <SelectItem key={c.iso2} value={c.iso2}>
                                <span className="mr-1">{c.flag}</span>
                                {c.dialCode}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#808080]" />
                          <Input
                            id="mobile"
                            type="tel"
                            inputMode="numeric"
                            placeholder="Enter mobile number"
                            value={localNumber}
                            onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                            className="pl-10 h-14 rounded-2xl bg-muted/50 border-border/50 focus:border-primary transition-all"
                            required
                            disabled={isLoading}
                          />
                        </div>
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

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      New to the portal?{" "}
                      <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </form>
              </TabsContent>
            </Tabs>
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

              {error && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl">
                  {error}
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("entry")
                  setCompanies([])
                  setError("")
                }}
                disabled={isLoading}
              >
                {activeTab === "email" ? "Use a different email" : "Use a different mobile number"}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                New to the portal?{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">
                  Create an account
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
