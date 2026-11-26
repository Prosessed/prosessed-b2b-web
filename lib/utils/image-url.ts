/**
 * Normalises product image from API: can be string or string[].
 * Returns the first URL for display, or undefined if none.
 */
export function getFirstImageUrl(
  image: string | string[] | null | undefined
): string | undefined {
  if (image == null) return undefined
  if (Array.isArray(image)) return image.length > 0 ? image[0] : undefined
  return typeof image === "string" ? image : undefined
}

type LineItemImageFields = {
  image?: string | string[] | null
  image_url?: string | string[] | null
  website_image?: string | string[] | null
  thumbnail?: string | string[] | null
  item_image?: string | string[] | null
  item_code?: string | null
}

/**
 * Prefer an image already on the line item; otherwise use a lookup by item_code.
 * Order/quote detail APIs currently omit images even when the product catalog has them.
 */
export function resolveLineItemImage(
  item: LineItemImageFields | null | undefined,
  imageByItemCode?: Record<string, string | string[] | null | undefined> | null
): string | undefined {
  const fromItem = getFirstImageUrl(
    item?.image ?? item?.image_url ?? item?.website_image ?? item?.thumbnail ?? item?.item_image
  )
  if (fromItem) return fromItem
  const code = typeof item?.item_code === "string" ? item.item_code : ""
  if (!code || !imageByItemCode) return undefined
  return getFirstImageUrl(imageByItemCode[code])
}

const isLocalDevHost = (): boolean => {
  if (typeof window === "undefined") return false
  const host = window.location.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")
}

const toAbsoluteTenantUrl = (
  imageUrl: string,
  companyBaseUrl: string | null | undefined
): string => {
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith("/files") || trimmed.startsWith("/private/files")) {
    if (!companyBaseUrl) return trimmed
    const base = companyBaseUrl.replace(/\/$/, "")
    return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`
  }
  return trimmed
}

const toProxiedMediaUrl = (absoluteUrl: string): string => {
  try {
    const parsed = new URL(absoluteUrl)
    if (
      !parsed.pathname.startsWith("/files") &&
      !parsed.pathname.startsWith("/private/files")
    ) {
      return absoluteUrl
    }
    if (
      parsed.hostname !== "internal.prosessed.com" &&
      !parsed.hostname.endsWith(".prosessed.com")
    ) {
      return absoluteUrl
    }
    return `/api/media?src=${encodeURIComponent(parsed.toString())}`
  } catch {
    return absoluteUrl
  }
}

/**
 * If the image URL from the API starts with "/files", prepend the logged-in
 * company base URL so the image loads from the correct tenant.
 * On local *.localhost previews, rewrite Prosessed file URLs through /api/media
 * so the browser does not load them cross-origin (which shows alt text).
 */
export function getDisplayImageUrl(
  imageUrl: string | null | undefined,
  companyBaseUrl: string | null | undefined
): string {
  if (!imageUrl || typeof imageUrl !== "string") return imageUrl ?? ""
  const absolute = toAbsoluteTenantUrl(imageUrl, companyBaseUrl)
  if (typeof window !== "undefined" && isLocalDevHost()) {
    return toProxiedMediaUrl(absolute)
  }
  return absolute
}
