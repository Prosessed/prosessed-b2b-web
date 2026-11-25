export type BrandColors = {
  primary: string
  primaryForeground: string
  background: string
  surface: string
  text: string
  mutedText: string
  border: string
  success: string
  warning: string
  danger: string
  /** Optional accent for secondary actions; defaults to the primary color. */
  secondary?: string
}

export type TenantBranding = {
  productName: string
  tagline?: string
  description?: string
  /** Optional. When omitted, the product name is rendered as text instead of an image. */
  logoUrl?: string
  /** Width / height of the logo image. Set for wide logos; omit for square marks. */
  logoAspectRatio?: number
  faviconUrl: string
  appleIconUrl?: string
  fontFamily?: string
  borderRadius?: string
  colors: BrandColors
  /** Optional dark-mode overrides; unset keys inherit from light with sensible defaults. */
  darkColors?: Partial<BrandColors>
}

export type TenantConfig = {
  id: string
  name: string
  domains: string[]
  branding: TenantBranding
  features?: Record<string, boolean>
  status?: "active" | "inactive"
  /**
   * The default tenant keeps the app exactly as it was before white-labeling
   * (built-in theme, logo and texts). Unlisted domains also fall back to it.
   */
  isDefault?: boolean
}

export const TENANT_ID_HEADER = "x-tenant-id"
