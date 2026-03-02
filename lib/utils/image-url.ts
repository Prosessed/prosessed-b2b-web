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
