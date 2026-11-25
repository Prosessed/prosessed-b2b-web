const HEX_COLOR =
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const OKLCH_COLOR =
  /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.%]+)?\s*\)$/i

const RGB_COLOR =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i

const HSL_COLOR =
  /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i

/**
 * Allowlisted font families mapped to the exact CSS font stack we emit.
 * Tenant config only picks a key; it never supplies raw CSS.
 */
export const FONT_STACKS = {
  Geist: '"Geist", "Geist Fallback"',
  "Geist Mono": '"Geist Mono", "Geist Mono Fallback"',
  Inter: '"Inter"',
  Epilogue: 'var(--font-epilogue), "Epilogue"',
  "system-ui": "system-ui",
  "ui-sans-serif": "ui-sans-serif",
  Georgia: "Georgia",
  "ui-serif": "ui-serif",
} as const

export type AllowedFontFamily = keyof typeof FONT_STACKS

export const ALLOWED_FONT_FAMILIES = Object.keys(FONT_STACKS) as AllowedFontFamily[]

const DEFAULT_FONT_FAMILY: AllowedFontFamily = "Geist"

const BORDER_RADIUS = /^\d+(\.\d+)?(px|rem|em)$/

export const isValidColor = (value: string): boolean => {
  const trimmed = value.trim()
  return (
    HEX_COLOR.test(trimmed) ||
    OKLCH_COLOR.test(trimmed) ||
    RGB_COLOR.test(trimmed) ||
    HSL_COLOR.test(trimmed)
  )
}

export const isValidBorderRadius = (value: string): boolean =>
  BORDER_RADIUS.test(value.trim())

export const isAllowedFontFamily = (value: string): value is AllowedFontFamily =>
  (ALLOWED_FONT_FAMILIES as string[]).includes(value)

export const sanitizeColor = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback
  return isValidColor(value) ? value.trim() : fallback
}

export const sanitizeBorderRadius = (
  value: string | undefined,
  fallback: string
): string => {
  if (!value) return fallback
  return isValidBorderRadius(value) ? value.trim() : fallback
}

/** Returns the CSS font stack for an allowlisted family, or the default stack. */
export const resolveFontStack = (value: string | undefined): string => {
  if (!value || !isAllowedFontFamily(value)) return FONT_STACKS[DEFAULT_FONT_FAMILY]
  return FONT_STACKS[value]
}
