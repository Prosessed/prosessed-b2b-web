/**
 * Domain → branding config (white-label).
 *
 * To add a client:
 * 1. Add a tenant entry below with domains + branding
 * 2. Drop assets in public/brands/<id>/
 * 3. Map the custom domain to the Firebase App Hosting backend
 * 4. Redeploy
 *
 * Local preview: use <id>.localhost (e.g. http://oblivion.localhost:3000)
 */
import type { TenantConfig } from "./types"

export const tenants: TenantConfig[] = [
  {
    id: "default",
    name: "Prosessed B2B",
    isDefault: true,
    domains: [
      "localhost",
      "127.0.0.1",
      "192.168.0.4",
    ],
    status: "active",
    branding: {
      productName: "B2B Commerce",
      description: "B2B commerce platform for quick ordering",
      faviconUrl: "/favicon.png",
      appleIconUrl: "/apple-icon.png",
      borderRadius: "0.5rem",
      fontFamily: "Geist",
      colors: {
        primary: "oklch(0.52 0.18 145)",
        primaryForeground: "oklch(1 0 0)",
        background: "oklch(1 0 0)",
        surface: "oklch(1 0 0)",
        text: "oklch(0.145 0 0)",
        mutedText: "oklch(0.556 0 0)",
        border: "oklch(0.922 0 0)",
        success: "oklch(0.55 0.15 145)",
        warning: "oklch(0.75 0.15 85)",
        danger: "oklch(0.577 0.245 27.325)",
      },
      darkColors: {
        primary: "oklch(0.58 0.2 145)",
        primaryForeground: "oklch(0.12 0 0)",
        background: "oklch(0.12 0 0)",
        surface: "oklch(0.16 0 0)",
        text: "oklch(0.985 0 0)",
        mutedText: "oklch(0.708 0 0)",
        border: "oklch(0.22 0 0)",
      },
    },
  },
  {
    id: "store",
    name: "Prosessed Store",
    domains: [
      "store.prosessed.com",
      "store.localhost",
    ],
    status: "active",
    features: {
      /** Login page: feature chips + secure/trust footer (store host only). */
      loginHighlights: true,
    },
    branding: {
      productName: "B2B Commerce",
      description: "B2B commerce platform for quick ordering",
      faviconUrl: "/favicon.png",
      appleIconUrl: "/apple-icon.png",
      borderRadius: "0.5rem",
      fontFamily: "Geist",
      colors: {
        primary: "oklch(0.52 0.18 145)",
        primaryForeground: "oklch(1 0 0)",
        background: "oklch(1 0 0)",
        surface: "oklch(1 0 0)",
        text: "oklch(0.145 0 0)",
        mutedText: "oklch(0.556 0 0)",
        border: "oklch(0.922 0 0)",
        success: "oklch(0.55 0.15 145)",
        warning: "oklch(0.75 0.15 85)",
        danger: "oklch(0.577 0.245 27.325)",
      },
      darkColors: {
        primary: "oklch(0.58 0.2 145)",
        primaryForeground: "oklch(0.12 0 0)",
        background: "oklch(0.12 0 0)",
        surface: "oklch(0.16 0 0)",
        text: "oklch(0.985 0 0)",
        mutedText: "oklch(0.708 0 0)",
        border: "oklch(0.22 0 0)",
      },
    },
  },
  {
    id: "devb2b",
    name: "devb2b",
    domains: [
      "devb2b.prosessed.com",
      "devb2b.localhost",
    ],
    status: "active",
    features: {
      distinctShell: true,
      heroLogin: true,
    },
    branding: {
      productName: "Oblivion",
      tagline: "Your trusted trade partner",
      description: "Wholesale ordering, quotes and account management for Oblivion partners",
      logoUrl: "/brands/oblivion/logo.png",
      logoAspectRatio: 2560 / 780,
      faviconUrl: "/brands/oblivion/favicon.jpg",
      appleIconUrl: "/brands/oblivion/apple-icon.jpg",
      borderRadius: "0.75rem",
      fontFamily: "Epilogue",
      colors: {
        primary: "#e64b31",
        primaryForeground: "#ffffff",
        background: "#ffffff",
        surface: "#ffffff",
        text: "#2d2d2d",
        mutedText: "#6e6e6e",
        border: "#e9e9e9",
        success: "#15803d",
        warning: "#ca8a04",
        danger: "#dc2626",
        secondary: "#00a8c8",
      },
      darkColors: {
        primary: "#f0674d",
        primaryForeground: "#ffffff",
        background: "#161616",
        surface: "#1f1f1f",
        text: "#f5f5f5",
        mutedText: "#a3a3a3",
        border: "#2e2e2e",
        secondary: "#2ec4e0",
      },
    },
  },
]
