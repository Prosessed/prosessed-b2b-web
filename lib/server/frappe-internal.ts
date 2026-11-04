/**
 * Server-only Frappe calls that require the internal service token.
 * Never import this module from client components or shared browser code.
 */

export type InternalCompany = {
  company_name: string
  company_url: string
}

export type B2bRegistrationPayload = {
  company_name: string
  contact_person: string
  email: string
  phone: string
  portal_link: string
  gst_number: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  pincode: string
}

const DEFAULT_INTERNAL_BASE_URL = "https://internal.prosessed.com"

const getInternalBaseUrl = (): string => {
  const raw =
    process.env.FRAPPE_INTERNAL_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_INTERNAL_BASE_URL
  return raw.replace(/\/$/, "")
}

/**
 * Prefer hosting/env `FRAPPE_API_TOKEN`. Fallback keeps deployed sites working when
 * the secret was not added to the host yet. This module is server-only (API routes);
 * it must never be imported from client code. Rotate the token in Frappe and set
 * FRAPPE_API_TOKEN on the host, then remove this fallback.
 */
const LEGACY_SERVER_FALLBACK_TOKEN = "f53b798f9a6d54f:f863ed6ae78da94"

const getServiceToken = (): string => {
  const fromEnv = process.env.FRAPPE_API_TOKEN?.trim()
  if (fromEnv) return fromEnv

  console.warn(
    "[frappe-internal] FRAPPE_API_TOKEN env is missing; using server fallback. Set FRAPPE_API_TOKEN on the host and rotate this token."
  )
  return LEGACY_SERVER_FALLBACK_TOKEN
}

const parseFrappeErrorMessage = (data: unknown): string | undefined => {
  if (data == null || typeof data !== "object") return undefined
  const o = data as Record<string, unknown>

  if (typeof o._server_messages === "string") {
    try {
      const parsed = JSON.parse(o._server_messages) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as { message?: string }
        if (typeof first?.message === "string") return first.message
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof o.exception === "string" && o.exception.trim()) {
    const lines = o.exception.trim().split("\n")
    const last = lines[lines.length - 1]?.trim()
    if (last) return last
  }

  if (typeof o.message === "string" && o.message.trim()) return o.message
  if (typeof o.exc_type === "string" && o.exc_type.trim()) return o.exc_type
  return undefined
}

const isFrappeExceptionPayload = (data: unknown): boolean => {
  if (data == null || typeof data !== "object") return false
  return typeof (data as { exc_type?: unknown }).exc_type === "string"
}

const mapCompanies = (data: unknown): InternalCompany[] => {
  if (!Array.isArray(data)) return []
  return data.map((item: Record<string, unknown>) => ({
    company_name: typeof item?.company_name === "string" ? item.company_name : "",
    company_url: typeof item?.company_url === "string" ? item.company_url : "",
  }))
}

const fetchAllUserMaster = async (
  filters: [string, string, string][]
): Promise<InternalCompany[]> => {
  const baseUrl = getInternalBaseUrl()
  const token = getServiceToken()
  const params = new URLSearchParams({
    // Keep same projection as the previous client call to avoid lookup regressions.
    fields: JSON.stringify(["*"]),
    filters: JSON.stringify(filters),
  })

  const response = await fetch(
    `${baseUrl}/api/resource/All User Master?${params}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${token}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Company lookup failed: ${response.status} ${response.statusText}`)
  }

  const result = (await response.json()) as { data?: unknown }
  return mapCompanies(result.data)
}

export const fetchCompaniesByEmail = async (
  email: string
): Promise<InternalCompany[]> => {
  const normalized = email.trim()
  if (!normalized) return []
  return fetchAllUserMaster([["email_id", "=", normalized]])
}

export const fetchCompaniesByMobile = async (
  mobileNumber: string
): Promise<InternalCompany[]> => {
  const normalized = mobileNumber.trim()
  if (!normalized) return []
  return fetchAllUserMaster([["custom_mobile_number", "=", normalized]])
}

export class FrappeUpstreamError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "FrappeUpstreamError"
  }
}

export const createB2bRegistration = async (
  payload: B2bRegistrationPayload
): Promise<{ message?: unknown }> => {
  const baseUrl = getInternalBaseUrl()
  const token = getServiceToken()
  const url = `${baseUrl}/api/resource/B2B Registration Form`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (typeof data === "object" && data !== null && isFrappeExceptionPayload(data)) {
    const errMsg =
      parseFrappeErrorMessage(data) ||
      "Registration could not be completed. Please verify your details or try again."
    throw new FrappeUpstreamError(response.ok ? 400 : response.status, errMsg)
  }

  if (!response.ok) {
    const errMsg =
      parseFrappeErrorMessage(data) ||
      (() => {
        const d = data as Record<string, unknown> | null
        if (d && typeof d === "object") {
          if (typeof d.message === "string") return d.message
          if (typeof d.detail === "string") return d.detail
          if (typeof d.error === "string") return d.error
        }
        return response.statusText || "Registration failed"
      })()
    throw new FrappeUpstreamError(response.status, errMsg)
  }

  return data as { message?: unknown }
}
