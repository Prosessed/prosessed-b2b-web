import type { AuthCredentials, AuthResponse, Company } from "../auth/types"

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
      body: JSON.stringify(credentials),
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

export async function requestOTP(
  email: string,
  companyUrl?: string | null
): Promise<{ success: boolean; message: string }> {
  const baseUrl = toBaseUrlOnly(companyUrl)

  const url =
    `${baseUrl}/api/method/prosessed_orderit.api.request_password_reset_otp` +
    `?email=${encodeURIComponent(email)}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    credentials: "include", // important for Frappe Guest session
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || "Failed to send OTP")
  }

  return {
    success: true,
    message: data?.message?.message || "OTP sent successfully",
  }
}
export async function verifyOtpAndResetPassword(
  email: string,
  otp: string,
  newPassword: string,
  companyUrl?: string | null
): Promise<{ success: boolean; message: string }> {
  const baseUrl = toBaseUrlOnly(companyUrl)

  const url =
    `${baseUrl}/api/method/prosessed_orderit.api.verify_otp_and_reset_password` +
    `?email=${encodeURIComponent(email)}` +
    `&otp=${encodeURIComponent(otp)}` +
    `&new_password=${encodeURIComponent(newPassword)}`

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || "Failed to reset password")
  }

  return {
    success: true,
    message:
      data?.message?.message || "Password has been reset successfully",
  }
}
