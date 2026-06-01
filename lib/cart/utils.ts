/** Normalize item codes for cart line matching (URL vs API casing/encoding). */
export const normalizeItemCode = (code: string | null | undefined): string => {
  if (!code) return ""
  try {
    return decodeURIComponent(String(code)).trim().toLowerCase()
  } catch {
    return String(code).trim().toLowerCase()
  }
}

export const findCartLineByItemCode = <
  T extends { item_code?: string | null },
>(
  items: T[] | null | undefined,
  itemCode: string | null | undefined
): T | null => {
  if (!items?.length || !itemCode) return null
  const target = normalizeItemCode(itemCode)
  if (!target) return null
  return items.find((line) => normalizeItemCode(line.item_code) === target) ?? null
}
