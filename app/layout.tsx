import type React from "react"
import type { Metadata } from "next"
import { Epilogue, Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/lib/auth/context"
import { CartProvider } from "@/lib/cart/context"
import { CartDrawerProvider } from "@/lib/cart/drawer-context"
import { CartDrawer } from "@/components/cart-drawer"
import { AuthGuard } from "@/components/auth-guard"
import { ThemeScript } from "@/components/theme-script"
import { BrandProvider } from "@/components/brand-provider"
import { getTenantFromRequest } from "@/lib/brand/resolve"
import { buildTenantThemeCss } from "@/lib/brand/theme-css"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
// Only used by tenants that pick it; no preload so other sites never download it.
const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  display: "swap",
  preload: false,
})

// Exactly the metadata the app had before white-labeling.
const ORIGINAL_METADATA: Metadata = {
  title: "B2B Commerce",
  description: "B2B commerce platform for quick ordering",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getTenantFromRequest()
    // Default shell tenants (incl. store loginHighlights) keep original metadata.
    if (tenant.isDefault || tenant.features?.loginHighlights) return ORIGINAL_METADATA

    const { branding } = tenant

    return {
      title: {
        default: branding.productName,
        template: `%s | ${branding.productName}`,
      },
      description:
        branding.description ?? "B2B commerce platform for quick ordering",
      generator: "v0.app",
      icons: {
        icon: branding.faviconUrl,
        apple: branding.appleIconUrl ?? branding.faviconUrl,
      },
    }
  } catch {
    return ORIGINAL_METADATA
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const tenant = await getTenantFromRequest()
  // Store mirrors the default shell (no white-label chrome); only loginHighlights differ.
  const isDefaultTenant =
    Boolean(tenant.isDefault) || Boolean(tenant.features?.loginHighlights)
  // The default tenant keeps the app's own theme untouched: nothing is injected.
  const themeCss = isDefaultTenant ? "" : buildTenantThemeCss(tenant.branding)

  return (
    <html
      lang="en"
      className={isDefaultTenant ? undefined : epilogue.variable}
      suppressHydrationWarning
    >
      <head>
        {themeCss && (
          <style
            id="tenant-theme"
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        )}
        <ThemeScript />
      </head>
      <body
        className={
          isDefaultTenant
            ? "font-sans antialiased"
            : "antialiased bg-background text-foreground"
        }
      >
        <BrandProvider tenant={tenant}>
          <AuthProvider>
            <CartProvider>
              <CartDrawerProvider>
                <AuthGuard>
                  <Navigation />
                  {children}
                  <Footer />
                  <CartDrawer />
                  <Analytics />
                </AuthGuard>
              </CartDrawerProvider>
            </CartProvider>
          </AuthProvider>
        </BrandProvider>
      </body>
    </html>
  )
}
