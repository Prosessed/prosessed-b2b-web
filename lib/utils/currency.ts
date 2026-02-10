const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  AUD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "C$",
  NZD: "NZ$",
  SGD: "S$",
  CHF: "CHF",
  CNY: "¥",
}

export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return "$"
  const c = String(code).toUpperCase()
  return CURRENCY_SYMBOLS[c] ?? c + " "
}

export function formatPrice(
  amount: number,
  currencyCode?: string | null,
  options?: Intl.NumberFormatOptions
): string {
  const symbol = getCurrencySymbol(currencyCode)
  const value = Number.isFinite(amount) ? amount : 0
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
  return symbol === "$" ? `$${formatted}` : `${symbol}${formatted}`
}

export function formatDate(
  dateStr: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  })
}
