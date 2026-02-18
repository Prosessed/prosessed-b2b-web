/**
 * Parse comma-separated tags from API (get_items_with_tags, item_detail, vtwo).
 * Trims and ignores empty strings.
 */
export const parseTags = (tagsStr: string | undefined): string[] => {
  if (!tagsStr || typeof tagsStr !== "string") return []
  return tagsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}
