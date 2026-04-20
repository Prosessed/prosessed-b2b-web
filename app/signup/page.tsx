"use client"

import type React from "react"
import { useCallback, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Building2, CheckCircle2, Mail, MapPin, UserCircle } from "lucide-react"
import {
  apiClient,
  ApiError,
  type B2bRegistrationPayload,
} from "@/lib/api/client"

type B2bRegistrationFormFields = Omit<B2bRegistrationPayload, "portal_link">

const normalizePortalUrl = (raw: string): string | undefined => {
  const t = raw.trim()
  if (!t) return undefined
  let url = t
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    throw new Error("Enter a valid portal URL (for example https://your-company.com)")
  }
}

const formatApiMessage = (msg: unknown): string => {
  if (msg == null) return ""
  if (typeof msg === "string") return msg
  if (typeof msg === "object" && msg !== null && "message" in msg) {
    const inner = (msg as { message?: unknown }).message
    if (typeof inner === "string") return inner
  }
  try {
    return JSON.stringify(msg)
  } catch {
    return ""
  }
}

const initialForm: B2bRegistrationFormFields = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  gst_number: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "Australia",
  pincode: "",
}

export default function SignUpPage() {
  const [portalUrl, setPortalUrl] = useState("")
  const [form, setForm] = useState<B2bRegistrationFormFields>(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [successDetail, setSuccessDetail] = useState("")

  const handleFieldChange = useCallback(
    (field: keyof B2bRegistrationFormFields) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
      },
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const debugB2b =
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_DEBUG_B2B_REGISTRATION === "1"
      if (debugB2b) {
        console.groupCollapsed("[B2B] Signup submit")
        console.log("portalUrl(raw):", portalUrl)
        console.log("form(raw):", form)
        console.groupEnd()
      }

      let portal: string | undefined
      try {
        portal = normalizePortalUrl(portalUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid portal URL.")
        setIsLoading(false)
        if (
          (process.env.NODE_ENV === "development" ||
            process.env.NEXT_PUBLIC_DEBUG_B2B_REGISTRATION === "1") &&
          typeof window !== "undefined"
        ) {
          console.warn("[B2B] Invalid portal URL:", err)
        }
        return
      }

      if (!portal) {
        setError("Please enter your portal URL.")
        setIsLoading(false)
        return
      }

      const payload: B2bRegistrationPayload = {
        company_name: form.company_name.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        portal_link: portal,
        gst_number: form.gst_number.trim(),
        address_line_1: form.address_line_1.trim(),
        address_line_2: form.address_line_2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode.trim(),
      }

      if (debugB2b) {
        const safePayload = {
          ...payload,
          email:
            typeof payload.email === "string" && payload.email.includes("@")
              ? payload.email.replace(/(^.).*(@.*$)/, "$1***$2")
              : payload.email,
          phone:
            typeof payload.phone === "string" && payload.phone.length > 4
              ? `${payload.phone.slice(0, 2)}***${payload.phone.slice(-2)}`
              : payload.phone,
        }
        console.log("[B2B] normalizedPortal:", portal || "(default)")
        console.log("[B2B] payload:", safePayload)
        console.log("[B2B] calling apiClient.createB2bRegistration…")
      }

      const res = await apiClient.createB2bRegistration(payload)
      const detail = formatApiMessage(res?.message)
      setSuccessDetail(detail || "Thank you — we have received your registration.")
      setIsSuccess(true)
      if (debugB2b) console.log("[B2B] success:", res)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.message === "string" && err.message.length > 0
            ? err.message
            : "Registration failed. Please try again."
        )
        if (
          (process.env.NODE_ENV === "development" ||
            process.env.NEXT_PUBLIC_DEBUG_B2B_REGISTRATION === "1") &&
          typeof window !== "undefined"
        ) {
          console.error("[B2B] ApiError:", err.status, err.message)
        }
      } else {
        setError("Something went wrong. Please try again.")
        if (
          (process.env.NODE_ENV === "development" ||
            process.env.NEXT_PUBLIC_DEBUG_B2B_REGISTRATION === "1") &&
          typeof window !== "undefined"
        ) {
          console.error("[B2B] Unknown error:", err)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-border/50 shadow-2xl rounded-3xl bg-card/80 backdrop-blur-xl">
            <CardHeader className="text-center space-y-2 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
              </div>
              <CardTitle className="text-2xl font-bold">Application received</CardTitle>
              <CardDescription className="text-base">
                {successDetail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                Once your account is approved, you can sign in with the email you registered.
              </p>
              <Button asChild className="w-full h-12 rounded-2xl text-base font-semibold">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 px-4 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4 -ml-2 rounded-xl text-muted-foreground hover:text-foreground">
              <Link href="/login" aria-label="Back to sign in">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Register your business</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Submit your details to request B2B portal access. Fields marked with <span className="text-destructive">*</span> are required.
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl rounded-3xl bg-card/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-xl md:text-2xl">Business registration</CardTitle>
                  <CardDescription className="text-sm md:text-base leading-relaxed">
                    Requests are reviewed by your distributor.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="portal-url" className="text-sm font-medium">
                    Portal URL <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="portal-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://your-company.com"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl bg-muted/30 border-border/60"
                    aria-describedby="portal-url-hint"
                  />
                  <p id="portal-url-hint" className="text-xs text-muted-foreground">
                    Your Website URL.
                  </p>
                </div>

                <section aria-labelledby="company-heading" className="space-y-4">
                  <h2 id="company-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" aria-hidden />
                    Company
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="company_name">
                        Legal / trading name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        required
                        value={form.company_name}
                        onChange={handleFieldChange("company_name")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="Acme Wholesale Pty Ltd"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="gst_number">GST / ABN / VAT (optional)</Label>
                      <Input
                        id="gst_number"
                        value={form.gst_number}
                        onChange={handleFieldChange("gst_number")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder=""
                      />
                    </div>
                  </div>
                </section>

                <section aria-labelledby="contact-heading" className="space-y-4">
                  <h2 id="contact-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <UserCircle className="h-4 w-4" aria-hidden />
                    Contact
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="contact_person">
                        Contact person <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact_person"
                        required
                        value={form.contact_person}
                        onChange={handleFieldChange("contact_person")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
                        <Input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={form.email}
                          onChange={handleFieldChange("email")}
                          disabled={isLoading}
                          className="h-11 pl-9 rounded-xl bg-muted/30 border-border/60"
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={handleFieldChange("phone")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="+61 400 000 000"
                      />
                    </div>
                  </div>
                </section>

                <section aria-labelledby="address-heading" className="space-y-4">
                  <h2 id="address-heading" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Address
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address_line_1">
                        Address line 1 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address_line_1"
                        required
                        value={form.address_line_1}
                        onChange={handleFieldChange("address_line_1")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="1 Example Street"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address_line_2">Address line 2</Label>
                      <Input
                        id="address_line_2"
                        value={form.address_line_2}
                        onChange={handleFieldChange("address_line_2")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        required
                        value={form.city}
                        onChange={handleFieldChange("city")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="Melbourne"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">
                        State / region <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="state"
                        required
                        value={form.state}
                        onChange={handleFieldChange("state")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="VIC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="country"
                        required
                        value={form.country}
                        onChange={handleFieldChange("country")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="Australia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">
                        Postcode <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        required
                        value={form.pincode}
                        onChange={handleFieldChange("pincode")}
                        disabled={isLoading}
                        className="h-11 rounded-xl bg-muted/30 border-border/60"
                        placeholder="3000"
                      />
                    </div>
                  </div>
                </section>

                {error && (
                  <div
                    className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 md:h-14 text-base md:text-lg font-semibold rounded-2xl shadow-lg shadow-primary/15"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                      Submitting…
                    </>
                  ) : (
                    "Submit registration"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have access?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
