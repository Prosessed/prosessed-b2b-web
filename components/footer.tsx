"use client"

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mail, Phone, Globe, MapPin, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/context"
import { useBannersAndDeals } from "@/lib/api/hooks"

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
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const { data: bannersData } = useBannersAndDeals()

  const isLoginRoute = pathname.startsWith("/login")

  useEffect(() => {
    if (!isAuthenticated || isLoginRoute) return
    if (branding) return

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
  }, [isAuthenticated, isLoginRoute, branding])

  if (isLoginRoute) {
    return null
  }

  const websiteUrl =
    branding?.website?.startsWith("http") ? branding.website : `https://${branding?.website ?? ""}`

  const hasBranding = branding && (branding.company_name || branding.email || branding.address)

  const social = bannersData?.social_handles
  const socialLinks: Array<{
    key: string
    label: string
    url: string
    icon: ComponentType<{ className?: string }>
  }> = [
    social?.instagram_url ? { key: "instagram", label: "Instagram", url: social.instagram_url, icon: Instagram } : null,
    social?.facebook_url ? { key: "facebook", label: "Facebook", url: social.facebook_url, icon: Facebook } : null,
    social?.twitter_url ? { key: "twitter", label: "Twitter", url: social.twitter_url, icon: Twitter } : null,
    social?.linkedin_url ? { key: "linkedin", label: "LinkedIn", url: social.linkedin_url, icon: Linkedin } : null,
    social?.youtube_url ? { key: "youtube", label: "YouTube", url: social.youtube_url, icon: Youtube } : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    url: string
    icon: ComponentType<{ className?: string }>
  }>

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

          {/* Social links */}
          {socialLinks.length > 0 && (
            <FooterColumn title="Social" className="text-center sm:text-left lg:col-span-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {socialLinks.map((s) => {
                  const Icon = s.icon
                  return (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-background/60 hover:bg-background border border-border/60 px-3 py-2 text-sm font-semibold text-foreground/90 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                      aria-label={s.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{s.label}</span>
                    </a>
                  )
                })}
              </div>
            </FooterColumn>
          )}
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
