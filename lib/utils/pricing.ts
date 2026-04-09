import { formatPrice } from "@/lib/utils/currency"

export type CustomerPriceMarginInfo = {
  price_margin?: number | null
  is_custom_price?: number | null
} | null | undefined

export type PriceDisplay =
  | { kind: "hidden" }
  | { kind: "single"; label: string }
  | { kind: "range"; minLabel: string; maxLabel: string }

export function getPriceDisplay(params: {
  basePrice: number
  currency?: string | null
  marginInfo?: CustomerPriceMarginInfo
}): PriceDisplay {
  const base = Number(params.basePrice)
  const flagRaw = params.marginInfo?.is_custom_price
  const flag = flagRaw == null ? null : Number(flagRaw)
  const margin = Number(params.marginInfo?.price_margin ?? 0)

  // is_custom_price = 0 => do not show any price
  if (flag === 0) return { kind: "hidden" }

  // is_custom_price = 1 => show base +/- margin as range
  if (flag === 1) {
    if (!Number.isFinite(base) || base <= 0) return { kind: "hidden" }
    if (!Number.isFinite(margin) || margin <= 0) {
      return { kind: "single", label: formatPrice(base, params.currency) }
    }
    const min = Math.max(0, base - margin)
    const max = base + margin
    return {
      kind: "range",
      minLabel: formatPrice(min, params.currency),
      maxLabel: formatPrice(max, params.currency),
    }
  }

  // is_custom_price = -1 => show base normally (as-is)
  // any other value / missing => show base normally
  if (!Number.isFinite(base) || base <= 0) return { kind: "hidden" }
  return { kind: "single", label: formatPrice(base, params.currency) }
}

