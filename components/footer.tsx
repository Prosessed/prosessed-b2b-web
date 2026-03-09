"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api/client"
import { Mail, Phone, Globe, MapPin } from "lucide-react"

interface CompanyDetails {
  company_name: string
  company_currency: string
  abn: string
  mobile: string
  email: string
  website: string
  address: string
}

const FooterColumn = ({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={className}>
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 sm:mb-4">
      {title}
    </h3>
    <div className="space-y-1.5 sm:space-y-2 text-sm text-foreground/90">{children}</div>
  </div>
)

export function Footer() {
  const [branding, setBranding] = useState<CompanyDetails | null>(null)

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const details = await apiClient.getCompanyDetails()
        if (details?.company_name || details?.email || details?.address) {
          setBranding(details)
        }
      } catch {
        // Fallback to static content
      }
    }
    loadBranding()
  }, [])

  const websiteUrl =
    branding?.website?.startsWith("http") ? branding.website : `https://${branding?.website ?? ""}`

  const hasBranding = branding && (branding.company_name || branding.email || branding.address)

  return (
    <footer className="bg-muted/30 border-t mt-16">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
          {/* Company */}
          <FooterColumn title="Company" className="text-center sm:text-left">
            {hasBranding ? (
              <>
                {branding.company_name && (
                  <p className="font-semibold text-base sm:text-lg text-foreground">
                    {branding.company_name}
                  </p>
                )}
                {branding.abn && (
                  <p className="text-xs sm:text-sm text-muted-foreground">ABN: {branding.abn}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">B2B Ordering Portal</p>
            )}
          </FooterColumn>

          {/* Contact */}
          <FooterColumn title="Contact" className="text-center sm:text-left">
            {hasBranding ? (
              <>
                {branding.mobile && (
                  <a
                    href={`tel:${branding.mobile.replace(/\s/g, "")}`}
                    className="flex items-center justify-center sm:justify-start gap-2 hover:text-primary transition-colors"
                    aria-label="Phone"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{branding.mobile}</span>
                  </a>
                )}
                {branding.email && (
                  <a
                    href={`mailto:${branding.email}`}
                    className="flex items-center justify-center sm:justify-start gap-2 hover:text-primary transition-colors break-all"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{branding.email}</span>
                  </a>
                )}
                {branding.website && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center sm:justify-start gap-2 hover:text-primary transition-colors"
                    aria-label="Website"
                  >
                    <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{branding.website}</span>
                  </a>
                )}
                {!branding.mobile && !branding.email && !branding.website && (
                  <p className="text-muted-foreground">—</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </FooterColumn>

          {/* Address */}
          <FooterColumn title="Address" className="text-center sm:text-left lg:col-span-1">
            {hasBranding && branding.address ? (
              <div className="flex items-start justify-center sm:justify-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <span className="text-xs sm:text-sm leading-relaxed">{branding.address}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </FooterColumn>

          {/* Portal features */}
          <FooterColumn title="Portal" className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Place Order · Get Quote · View Orders · Track Dispatch · Download Invoice · Ledger
              Statement
            </p>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-border/50 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            This portal is powered by{" "}
            <Link
              href="https://prosessed.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              prosessed.ai
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
