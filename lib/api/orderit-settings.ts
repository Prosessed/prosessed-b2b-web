/**
 * OrderIT settings drive product API flags (in stock only, recommended sort).
 * Fetched before product APIs and merged in one place to avoid duplication.
 */

import { apiClient } from "./client"

const ORDERIT_SETTINGS_PATH =
  "/api/method/prosessed_orderit.orderit_app.apis.orderit_settings.get_orderit_settings"

export type OrderitSettings = {
  show_in_stock_only?: number | string | boolean
  recommended_priority_sort?: number | string | boolean
  [key: string]: unknown
}

const isTruthyOne = (v: unknown): boolean =>
  v === 1 || v === "1" || v === true

type Auth = { apiKey?: string | null; apiSecret?: string | null; sid?: string | null }

/** Short-lived cache per auth fingerprint to avoid N+1 before each product call. */
const cache = new Map<string, { settings: OrderitSettings | null; expires: number }>()
const TTL_MS = 60_000

const cacheKey = (auth: Auth) =>
  (auth.sid ? `sid:${auth.sid}` : `${auth.apiKey}:${auth.apiSecret}`).slice(0, 80)

/**
 * Fetch OrderIT settings once (per auth) before product APIs.
 * Safe to call from every product hook fetcher — deduped via cache.
 */
export const fetchOrderitSettings = async (auth: Auth): Promise<OrderitSettings | null> => {
  const key = cacheKey(auth)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expires > now) return hit.settings

  try {
    const response = await apiClient.request<{ message?: OrderitSettings } | OrderitSettings>(
      ORDERIT_SETTINGS_PATH,
      {
        method: "GET",
        auth,
      }
    )
    const msg = (response as { message?: OrderitSettings })?.message
    const settings =
      msg && typeof msg === "object"
        ? (msg as OrderitSettings)
        : (response as OrderitSettings) && typeof response === "object" && !Array.isArray(response)
          ? (response as OrderitSettings)
          : null
    cache.set(key, { settings, expires: now + TTL_MS })
    return settings
  } catch {
    cache.set(key, { settings: null, expires: now + TTL_MS })
    return null
  }
}

export type ProductRequestExtras = {
  inStockOnly?: 0 | 1
  sortByRecommended?: 0 | 1
  sortByQty?: "asc" | "desc"
}

/**
 * Merge settings into a POST JSON body used by listing/search/most-bought APIs.
 * - show_in_stock_only = 1 → inStockOnly 1 unless override false
 * - Default sort = recommended: sortByRecommended 1 when settings say so — only when NOT using price sort
 * - sortByQty only when explicitly asc (low→high) or desc (high→low); mutually exclusive with sortByRecommended
 */
export const mergeOrderitIntoBody = (
  body: Record<string, unknown>,
  settings: OrderitSettings | null,
  opts?: {
    /** Explicit user toggle: true = force in stock only, false = force off, undefined = follow settings only */
    inStockOnlyOverride?: boolean | null
    /** Only pass for product-page price sort: asc = low→high, desc = high→low (exact API param) */
    sortByQty?: "asc" | "desc"
  }
): Record<string, unknown> => {
  const out = { ...body }
  const priceSort =
    opts?.sortByQty === "asc" || opts?.sortByQty === "desc" ? opts.sortByQty : null

  if (priceSort) {
    out.sortByQty = priceSort
    // Price sort replaces recommended for this request
    delete (out as { sortByRecommended?: unknown }).sortByRecommended
  } else if (settings && isTruthyOne(settings.recommended_priority_sort)) {
    out.sortByRecommended = 1
  }

  if (settings && isTruthyOne(settings.show_in_stock_only)) {
    if (opts?.inStockOnlyOverride === false) {
      out.inStockOnly = 0
    } else {
      out.inStockOnly = 1
    }
  } else if (opts?.inStockOnlyOverride === true) {
    out.inStockOnly = 1
  } else if (opts?.inStockOnlyOverride === false) {
    out.inStockOnly = 0
  }

  return out
}

/**
 * Append OrderIT flags to URLSearchParams for GET product endpoints (e.g. tagged items).
 */
export const appendOrderitToSearchParams = (
  params: URLSearchParams,
  settings: OrderitSettings | null,
  opts?: {
    inStockOnlyOverride?: boolean | null
    sortByQty?: "asc" | "desc"
  }
): URLSearchParams => {
  const priceSort =
    opts?.sortByQty === "asc" || opts?.sortByQty === "desc" ? opts.sortByQty : null
  if (priceSort) {
    params.set("sortByQty", priceSort)
  } else if (settings && isTruthyOne(settings.recommended_priority_sort)) {
    params.set("sortByRecommended", "1")
  }

  if (settings && isTruthyOne(settings.show_in_stock_only)) {
    if (opts?.inStockOnlyOverride !== false) {
      params.set("inStockOnly", "1")
    }
  } else if (opts?.inStockOnlyOverride === true) {
    params.set("inStockOnly", "1")
  }

  return params
}
