/**
 * Parse comma-separated tags from API (get_items_with_tags, item_detail, vtwo).
 * Trims and ignores empty strings.
 */
export const parseTags = (tagsStr: string | undefined): string[] => {
  if (!tagsStr || typeof tagsStr !== "string") return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of tagsStr.split(",")) {
    const t = part.trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}
