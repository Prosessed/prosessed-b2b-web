"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/context"
import { Globe, Mail, MapPin, Phone } from "lucide-react"

interface CompanyDetails {
  company_name: string
  company_currency: string
  abn: string
  mobile: string
  email: string
  website: string
  address: string
}

export default function ContactPage() {
  const { isAuthenticated } = useAuth()
  const [branding, setBranding] = useState<CompanyDetails | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    if (branding) return

    const loadBranding = async () => {
      try {
        const details = await apiClient.getCompanyDetails()
        if (details?.company_name || details?.email || details?.address) {
          setBranding(details)
        }
      } catch {
        // show fallback UI
      }
    }
    loadBranding()
  }, [isAuthenticated, branding])

  const websiteUrl = useMemo(() => {
    if (!branding?.website) return ""
    return branding.website.startsWith("http") ? branding.website : `https://${branding.website}`
  }, [branding?.website])

  const hasBranding = Boolean(branding && (branding.company_name || branding.email || branding.address))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            Reach out using the details below.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Contact</h2>
            {hasBranding ? (
              <div className="space-y-3">
                {branding?.mobile && (
                  <a
                    href={`tel:${branding.mobile.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Phone"
                  >
                    <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{branding.mobile}</span>
                  </a>
                )}
                {branding?.email && (
                  <a
                    href={`mailto:${branding.email}`}
                    className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-muted/40 transition-colors break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{branding.email}</span>
                  </a>
                )}
                {branding?.website && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Website"
                  >
                    <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{branding.website}</span>
                  </a>
                )}
                {!branding?.mobile && !branding?.email && !branding?.website && (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Address</h2>
            {hasBranding && branding?.address ? (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm leading-relaxed">{branding.address}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
