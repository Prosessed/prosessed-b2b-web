import type { AuthCredentials, AuthResponse, Company } from "@/lib/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

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

    return data
  } catch (error) {
    console.error("[v0] login error:", error)
    throw error
  }
}
