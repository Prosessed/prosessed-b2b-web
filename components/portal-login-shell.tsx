"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { FileText, ShoppingBasket, Tag, Wallet, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type PortalLoginShellProps = {
  productName: string
  tagline?: string
  children: ReactNode
}

type NavItem = {
  label: string
  href: string
}

type IconItem = {
  label: string
  icon: LucideIcon
}

type FeatureCard = {
  title: string
  body: string
  icon: LucideIcon
}

const FOOTER_LINKS: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Contact Us", href: "/contact" },
  { label: "Create an account", href: "/signup" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms and Conditions", href: "/terms" },
]

const HERO_HIGHLIGHTS: IconItem[] = [
  { label: "Trade pricing", icon: Tag },
  { label: "Easy reorders", icon: ShoppingBasket },
  { label: "Fast quotes", icon: FileText },
  { label: "Clear ledger", icon: Wallet },
]

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: "Live trade pricing",
    body: "See your account-specific prices and availability as you build each order.",
    icon: Tag,
  },
  {
    title: "Quotes and orders",
    body: "Request a quote, convert it to an order and follow it through to delivery.",
    icon: FileText,
  },
  {
    title: "Ledger and payments",
    body: "Review statements and settle open invoices in a few clicks.",
    icon: Wallet,
  },
]

const SectionLabel = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <p
    className={cn(
      "flex items-center gap-4 text-[13px] font-semibold uppercase tracking-[0.19em] text-primary",
      className
    )}
  >
    {children}
    <span className="h-px w-20 bg-primary/30" aria-hidden />
  </p>
)

const IconBadge = ({ icon: Icon, className }: { icon: LucideIcon; className?: string }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary",
      className
    )}
  >
    <Icon className="h-5 w-5" aria-hidden />
  </span>
)

export const PortalLoginShell = ({
  productName,
  tagline,
  children,
}: PortalLoginShellProps) => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-muted via-background to-primary/10 px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
            <div
              className="pointer-events-none absolute -right-28 -top-28 h-[28rem] w-[28rem] rounded-full border-[3px] border-primary/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-32 -left-20 h-[22rem] w-[22rem] rounded-full border-[3px] border-primary/10"
              aria-hidden
            />

            <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionLabel>B2B Ordering Portal</SectionLabel>
                <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl xl:text-[3.4rem]">
                  Your One-Stop Portal for
                  <span className="block text-primary">Trade Ordering</span>
                </h1>
                <div className="mt-6 h-0.5 w-24 bg-primary" aria-hidden />
                <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                  Place orders, request quotes, check your ledger and pay invoices — all
                  from one trade account.
                </p>

                <ul className="mt-8 grid max-w-md grid-cols-2 gap-5 sm:grid-cols-4">
                  {HERO_HIGHLIGHTS.map((item) => (
                    <li
                      key={item.label}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <IconBadge icon={item.icon} className="h-12 w-12" />
                      <span className="text-xs font-semibold leading-tight text-foreground">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-center lg:justify-end">{children}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <SectionLabel>Why order online</SectionLabel>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything your store needs, in one account
            </h2>
          </div>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <li
                key={card.title}
                className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <IconBadge icon={card.icon} className="h-12 w-12 rounded-xl" />
                <h3 className="mt-5 text-xl font-bold text-foreground">{card.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{card.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <p className="text-2xl font-bold tracking-tight">{productName}</p>
            {tagline && (
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/80">
                {tagline}
              </p>
            )}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/90">
              Wholesale ordering, quotes and account management in one portal.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em]">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-foreground/90 underline-offset-4 transition-colors hover:text-primary-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em]">
              Need help?
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/90">
              Talk to our team about your trade account.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/80 sm:flex-row sm:px-6 lg:px-8">
            <p>
              © {currentYear} {productName}. All rights reserved.
            </p>
            <p>
              Powered by{" "}
              <Link
                href="https://prosessed.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline-offset-4 hover:underline"
              >
                prosessed.ai
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
