import type { Company, LoginResponse } from "../auth/types" // Assuming these types are declared in a separate file

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"
const COMPANY_FETCH_BASE_URL = "https://internal.prosessed.com"
const FRAPPE_API_TOKEN = "f53b798f9a6d54f:f863ed6ae78da94"

let currentBaseUrl = ""

export const setApiBaseUrl = (url: string) => {
  // Clean URL to match requirements: up to .com (no trailing slashes or paths)
  try {
    const parsed = new URL(url)
    currentBaseUrl = `${parsed.protocol}//${parsed.host}`
  } catch (e) {
    currentBaseUrl = url.replace(/\/$/, "")
  }
}

export const getApiBaseUrl = () => currentBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || ""

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const apiClient = {
  async getCompaniesByEmail(email: string): Promise<Company[]> {
    const params = new URLSearchParams({
      fields: '["*"]',
      filters: `[["email_id", "=", "${email}"]]`,
    })

    const response = await fetch(`${COMPANY_FETCH_BASE_URL}/api/resource/All User Master?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${FRAPPE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, `Failed to fetch companies: ${response.statusText}`)
    }

    const result = await response.json()
    const data = result.data || []

    return data.map((item: any) => ({
      company_name: item.company_name || "",
      company_url: item.company_url || "",
    }))
  },

  async login(email: string, password: string, companyUrl: string): Promise<LoginResponse> {
    setApiBaseUrl(companyUrl)
    const baseUrl = getApiBaseUrl()

    const response = await fetch(`${baseUrl}/api/method/prosessed_orderit.api.login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usr: email,
        pwd: password,
      }),
    })

    if (!response.ok) {
      throw new ApiError(response.status, "Invalid credentials")
    }

    const data: LoginResponse = await response.json()

    if (data.message.success_key !== 1) {
      throw new ApiError(401, data.message.message || "Authentication failed")
    }

    return data
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }

    return response.json()
  },
}
