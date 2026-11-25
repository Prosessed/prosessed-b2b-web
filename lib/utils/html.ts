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

const BLOCK_TAG_PATTERN = /<\/?(?:p|div|br|li|ul|ol|h[1-6]|tr|table|section|article)\b[^>]*>/gi
const NON_TEXT_BLOCK_PATTERN = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g
const ANY_TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/g

/**
 * Convert ERP text (item name / description) to plain display text.
 * ERP rich-text fields save wrappers like `<div class="ql-editor"><p>ALMOND 14X400G </p></div>`;
 * the portal must always show `ALMOND 14X400G`. Also decodes entities (`&amp;`, `&nbsp;`).
 */
export const toPlainText = (value: string | null | undefined): string => {
  if (value == null || value === "") return ""

  const decoded = decodeHtmlEntities(String(value))

  return decoded
    .replace(NON_TEXT_BLOCK_PATTERN, " ")
    .replace(COMMENT_PATTERN, " ")
    .replace(BLOCK_TAG_PATTERN, " ")
    .replace(ANY_TAG_PATTERN, "")
    .replace(/&nbsp;|\u00a0/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}
