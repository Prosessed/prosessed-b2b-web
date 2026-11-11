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

/**
 * If the image URL from the API starts with "/files", prepend the logged-in
 * company base URL so the image loads from the correct tenant.
 */
export function getDisplayImageUrl(
  imageUrl: string | null | undefined,
  companyBaseUrl: string | null | undefined
): string {
  if (!imageUrl || typeof imageUrl !== "string") return imageUrl ?? ""
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith("/files") && companyBaseUrl) {
    const base = companyBaseUrl.replace(/\/$/, "")
    return base + (trimmed.startsWith("/") ? trimmed : "/" + trimmed)
  }
  return imageUrl
}
