import type { BrandColors, TenantBranding } from "./types"
import {
  resolveFontStack,
  sanitizeBorderRadius,
  sanitizeColor,
} from "./validation"

type ResolvedColors = Required<BrandColors>

const DEFAULT_COLORS: ResolvedColors = {
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
  secondary: "oklch(0.52 0.18 145)",
}

const DEFAULT_DARK: ResolvedColors = {
  primary: "oklch(0.58 0.2 145)",
  primaryForeground: "oklch(0.12 0 0)",
  background: "oklch(0.12 0 0)",
  surface: "oklch(0.16 0 0)",
  text: "oklch(0.985 0 0)",
  mutedText: "oklch(0.708 0 0)",
  border: "oklch(0.22 0 0)",
  success: "oklch(0.6 0.15 145)",
  warning: "oklch(0.8 0.15 85)",
  danger: "oklch(0.65 0.22 25)",
  secondary: "oklch(0.58 0.2 145)",
}

const resolveColors = (
  colors: BrandColors,
  overrides?: Partial<BrandColors>,
  fallback: ResolvedColors = DEFAULT_COLORS
): ResolvedColors => {
  const primary = sanitizeColor(overrides?.primary ?? colors.primary, fallback.primary)

  return {
    primary,
    primaryForeground: sanitizeColor(
      overrides?.primaryForeground ?? colors.primaryForeground,
      fallback.primaryForeground
    ),
    background: sanitizeColor(
      overrides?.background ?? colors.background,
      fallback.background
    ),
    surface: sanitizeColor(overrides?.surface ?? colors.surface, fallback.surface),
    text: sanitizeColor(overrides?.text ?? colors.text, fallback.text),
    mutedText: sanitizeColor(
      overrides?.mutedText ?? colors.mutedText,
      fallback.mutedText
    ),
    border: sanitizeColor(overrides?.border ?? colors.border, fallback.border),
    success: sanitizeColor(overrides?.success ?? colors.success, fallback.success),
    warning: sanitizeColor(overrides?.warning ?? colors.warning, fallback.warning),
    danger: sanitizeColor(overrides?.danger ?? colors.danger, fallback.danger),
    secondary: sanitizeColor(overrides?.secondary ?? colors.secondary, primary),
  }
}

const blockForSelector = (
  selector: string,
  colors: ResolvedColors,
  radius: string,
  fontStack: string
) => {
  // Subtle neutral fill derived from surface + text so muted areas stay visible on white themes.
  const subtleFill = `color-mix(in oklab, ${colors.surface} 95%, ${colors.text})`

  return `
${selector} {
  --background: ${colors.background};
  --foreground: ${colors.text};
  --card: ${colors.surface};
  --card-foreground: ${colors.text};
  --popover: ${colors.surface};
  --popover-foreground: ${colors.text};
  --primary: ${colors.primary};
  --primary-foreground: ${colors.primaryForeground};
  --secondary: ${subtleFill};
  --secondary-foreground: ${colors.text};
  --muted: ${subtleFill};
  --muted-foreground: ${colors.mutedText};
  --accent: ${colors.primary};
  --accent-foreground: ${colors.primaryForeground};
  --destructive: ${colors.danger};
  --destructive-foreground: ${colors.primaryForeground};
  --border: ${colors.border};
  --input: ${colors.border};
  --ring: ${colors.primary};
  --radius: ${radius};
  --sidebar: ${colors.surface};
  --sidebar-foreground: ${colors.text};
  --sidebar-primary: ${colors.primary};
  --sidebar-primary-foreground: ${colors.primaryForeground};
  --sidebar-accent: ${subtleFill};
  --sidebar-accent-foreground: ${colors.text};
  --sidebar-border: ${colors.border};
  --sidebar-ring: ${colors.primary};
  --brand-primary: ${colors.primary};
  --brand-primary-foreground: ${colors.primaryForeground};
  --brand-secondary: ${colors.secondary};
  --brand-bg: ${colors.background};
  --brand-surface: ${colors.surface};
  --brand-text: ${colors.text};
  --brand-muted-text: ${colors.mutedText};
  --brand-border: ${colors.border};
  --brand-radius: ${radius};
  --brand-success: ${colors.success};
  --brand-warning: ${colors.warning};
  --brand-danger: ${colors.danger};
  --font-sans: ${fontStack}, ui-sans-serif, system-ui, sans-serif;
}
`.trim()
}

/**
 * Build a safe CSS snippet that overrides shadcn tokens from tenant branding.
 * Only predefined property names and validated values are emitted.
 */
export const buildTenantThemeCss = (branding: TenantBranding): string => {
  const light = resolveColors(branding.colors)
  const dark = resolveColors(branding.colors, branding.darkColors, DEFAULT_DARK)
  const radius = sanitizeBorderRadius(branding.borderRadius, "0.5rem")
  const fontStack = resolveFontStack(branding.fontFamily)

  return [
    blockForSelector(":root", light, radius, fontStack),
    blockForSelector(".dark", dark, radius, fontStack),
    "body { font-family: var(--font-sans); }",
  ].join("\n")
}
