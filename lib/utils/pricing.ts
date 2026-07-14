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
  // Temporarily unused while custom-price rules are disabled:
  // const flagRaw = params.marginInfo?.is_custom_price
  // const flag = flagRaw == null ? null : Number(flagRaw)
  // const margin = Number(params.marginInfo?.price_margin ?? 0)

  // Temporarily disabled: is_custom_price = 0 used to hide price ("Price on Request")
  // if (flag === 0) return { kind: "hidden" }

  // Temporarily disabled: is_custom_price = 1 used to show base +/- margin as range
  // if (flag === 1) {
  //   if (!Number.isFinite(base) || base <= 0) return { kind: "hidden" }
  //   if (!Number.isFinite(margin) || margin <= 0) {
  //     return { kind: "single", label: formatPrice(base, params.currency) }
  //   }
  //   const min = Math.max(0, base - margin)
  //   const max = base + margin
  //   return {
  //     kind: "range",
  //     minLabel: formatPrice(min, params.currency),
  //     maxLabel: formatPrice(max, params.currency),
  //   }
  // }

  // Always show base normally for now (ignores is_custom_price / price_margin)
  // Temporarily disabled: do not return "hidden" (UI showed "Price on Request")
  // if (!Number.isFinite(base) || base <= 0) return { kind: "hidden" }
  if (!Number.isFinite(base) || base <= 0) {
    return { kind: "single", label: formatPrice(0, params.currency) }
  }
  return { kind: "single", label: formatPrice(base, params.currency) }
}
