import type { AuthCredentials, AuthResponse, Company } from "../auth/types"
import { isAllowedProsessedOrigin } from "../utils/tenant-url"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

export async function getCompaniesByEmail(email: string): Promise<Company[]> {
  try {
    const params = new URLSearchParams({
      fields: '["*"]',
      filters: JSON.stringify([["email_id", "=", email]]),
    })

    const response = await fetch(`${BASE_URL}/api/resource/All User Master?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`)
    }

    const result = await response.json()
    const data = result.data || []

    return data.map((item: any) => ({
      company_name: item.company_name || "",
      company_url: item.company_url || "",
    }))
  } catch (error) {
    console.error("[v0] getCompaniesByEmail error:", error)
    throw error
  }
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  try {

    console.log("Auth credentials", credentials);
    const response = await fetch(`${BASE_URL}/api/method/prosessed_orderit.api.login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...credentials, platform: "web" }),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.message?.success_key !== 1) {
      throw new Error(data.message?.message || "Authentication failed")
    }

    console.log("Auth success", data);
    return data
  } catch (error) {
    console.error("[v0] login error:", error)
    throw error
  }
}
/** Normalize URL to protocol + host only */
function toBaseUrlOnly(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url).origin
  } catch {
    return url.replace(/\/$/, "").replace(/\/(app|home).*$/, "")
  }
}

const readFrappeMessage = (data: { message?: unknown }, fallback: string): string => {
  if (typeof data?.message === "string" && data.message.trim()) return data.message
  if (
    data?.message &&
    typeof data.message === "object" &&
    "message" in data.message &&
    typeof data.message.message === "string" &&
    data.message.message.trim()
  ) {
    return data.message.message
  }
  return fallback
}

/**
 * Call the tenant through the same-origin proxy.
 * The browser cannot call tenant hosts directly: they do not send CORS headers,
 * which surfaces as "Failed to fetch". The proxy only allows Prosessed hosts.
 */
const fetchTenant = async (absoluteUrl: string, init?: RequestInit): Promise<Response> => {
  const parsed = new URL(absoluteUrl)
  if (!isAllowedProsessedOrigin(parsed.origin)) {
    throw new Error("Company URL is not an allowed Prosessed host")
  }
  const headers = new Headers(init?.headers)
  headers.set("x-proxy-origin", parsed.origin)

  return fetch(`/api/proxy${parsed.pathname}${parsed.search}`, {
    ...init,
    headers,
  })
}

export async function requestOTP(
  email: string,
  companyUrl?: string | null
): Promise<{ success: boolean; message: string }> {
  const baseUrl = toBaseUrlOnly(companyUrl)
  if (!baseUrl || !isAllowedProsessedOrigin(baseUrl)) {
    throw new Error("Company URL is missing or not an allowed Prosessed host")
  }

  const url =
    `${baseUrl}/api/method/prosessed_orderit.api.request_password_reset_otp` +
    `?email=${encodeURIComponent(email)}`

  let response: Response
  try {
    response = await fetchTenant(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch {
    throw new Error("Could not reach the company server. Please try again.")
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.message?.success === false) {
    throw new Error(readFrappeMessage(data, "Failed to send OTP"))
  }

  return {
    success: true,
    message: readFrappeMessage(data, "OTP sent successfully"),
  }
}
export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string,
  companyUrl?: string | null
): Promise<{ success: boolean; message: string }> {
  const baseUrl = toBaseUrlOnly(companyUrl)
  if (!baseUrl || !isAllowedProsessedOrigin(baseUrl)) {
    throw new Error("Company URL is missing or not an allowed Prosessed host")
  }

  const url =
    `${baseUrl}/api/method/prosessed_orderit.api.verify_otp_and_reset_password` +
    `?email=${encodeURIComponent(email)}` +
    `&otp=${encodeURIComponent(otp)}` +
    `&new_password=${encodeURIComponent(newPassword)}`

  let response: Response
  try {
    response = await fetchTenant(url, { method: "POST" })
  } catch {
    throw new Error("Could not reach the company server. Please try again.")
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.message?.success === false) {
    throw new Error(readFrappeMessage(data, "Failed to reset password"))
  }

  return {
    success: true,
    message: readFrappeMessage(data, "Password has been reset successfully"),
  }
}
