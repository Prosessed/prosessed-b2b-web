/**
 * Tenant API hosts must be Prosessed-controlled.
 * Keep this in sync with /api/proxy — credentials must never POST elsewhere.
 */
export const isAllowedProsessedOrigin = (
  originOrUrl: string | null | undefined
): originOrUrl is string => {
  if (!originOrUrl) return false
  try {
    const { protocol, hostname } = new URL(originOrUrl)
    if (protocol !== "https:" && protocol !== "http:") return false
    return (
      hostname === "internal.prosessed.com" ||
      hostname.endsWith(".prosessed.com")
    )
  } catch {
    return false
  }
}

/** Returns protocol://host for an allowed Prosessed URL; throws otherwise. */
export const assertAllowedProsessedOrigin = (url: string): string => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Invalid company URL")
  }

  const origin = `${parsed.protocol}//${parsed.host}`
  if (!isAllowedProsessedOrigin(origin)) {
    throw new Error("Company URL is not an allowed Prosessed host")
  }
  return origin
}
