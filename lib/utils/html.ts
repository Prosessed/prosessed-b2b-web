/**
 * Decode common HTML entities in API text (e.g. item descriptions with `&amp;`).
 * Runs a few passes so double-encoded values like `&amp;amp;` also resolve.
 */
export const decodeHtmlEntities = (value: string | null | undefined): string => {
  if (value == null || value === "") return ""

  let text = String(value)
  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => {
        const n = Number(code)
        return Number.isFinite(n) ? String.fromCharCode(n) : _
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const n = parseInt(hex, 16)
        return Number.isFinite(n) ? String.fromCharCode(n) : _
      })
    if (next === text) break
    text = next
  }
  return text
}
