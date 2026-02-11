import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/lib/auth/context"
import { CartProvider } from "@/lib/cart/context"
import { CartDrawerProvider } from "@/lib/cart/drawer-context"
import { CartDrawer } from "@/components/cart-drawer"
import { AuthGuard } from "@/components/auth-guard"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "B2B Commerce",
  description: "B2B commerce platform for quick ordering",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <CartDrawerProvider>
              <AuthGuard>
                <Navigation />
                {children}
                <CartDrawer />
                <Analytics />
              </AuthGuard>
            </CartDrawerProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
