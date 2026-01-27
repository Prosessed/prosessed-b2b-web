import type { Company, LoginResponse } from "../auth/types" // Assuming these types are declared in a separate file

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"
const COMPANY_FETCH_BASE_URL = "https://internal.prosessed.com"
const FRAPPE_API_TOKEN = "f53b798f9a6d54f:f863ed6ae78da94"

let currentBaseUrl = ""

interface AuthCredentials {
  sid?: string | null
  apiKey?: string | null
  apiSecret?: string | null
}

const getAuthFromStorage = (): AuthCredentials => {
  if (typeof window === "undefined") return {}
  
  // Try zustand store first (auth-storage)
  try {
    const authStorage = localStorage.getItem("auth-storage")
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      const state = parsed?.state
      if (state && (state.apiKey || state.sid)) {
        return {
          sid: state.sid || null,
          apiKey: state.apiKey || null,
          apiSecret: state.apiSecret || null,
        }
      }
    }
  } catch (e) {
    // Continue to next storage
  }
  
  // Fallback: try context-based auth storage (prosessed_auth)
  try {
    const userStorage = localStorage.getItem("prosessed_auth")
    if (userStorage) {
      const user = JSON.parse(userStorage)
      if (user && (user.apiKey || user.sid)) {
        return {
          sid: user.sid || null,
          apiKey: user.apiKey || null,
          apiSecret: user.apiSecret || null,
        }
      }
    }
  } catch (e2) {
    // Ignore errors
  }
  
  return {}
}

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

  async request<T>(endpoint: string, options: RequestInit & { auth?: AuthCredentials } = {}): Promise<T> {
    const baseUrl = getApiBaseUrl()
    // Use provided auth or get from storage
    const auth = options.auth || getAuthFromStorage()
    
    // Build headers with authentication
    const headers: HeadersInit = new Headers()
    headers.set("Content-Type", "application/json")
    
    // Add any existing headers from options
    if (options.headers) {
      const existingHeaders = new Headers(options.headers)
      existingHeaders.forEach((value, key) => {
        headers.set(key, value)
      })
    }
    
    // Add Frappe authentication - use token auth (preferred method)
    // Note: Cookie header cannot be set manually in browsers, so we only use token auth
    if (auth.apiKey && auth.apiSecret) {
      headers.set("Authorization", `token ${auth.apiKey}:${auth.apiSecret}`)
    }
    
    // Use include credentials for cross-origin requests with authentication
    const credentials: RequestCredentials = auth.apiKey ? "include" : "same-origin"
    
    const fullUrl = `${baseUrl}${endpoint}`
    const response = await fetch(fullUrl, {
      method: options.method || "GET",
      headers,
      credentials,
      body: options.body,
      signal: options.signal,
    })

    // Log cart API calls with detailed request/response
    if (endpoint.includes("cart") || endpoint.includes("quotation")) {
      const requestBody = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : null
      console.log(`[Cart API] ${options.method || "GET"} ${fullUrl}`)
      console.log(`[Cart API] Request Body:`, requestBody)
      
      // Clone response to read body without consuming it
      const responseClone = response.clone()
      responseClone.json().then((data) => {
        console.log(`[Cart API] Response Status: ${response.status}`)
        console.log(`[Cart API] Response Body:`, data)
      }).catch(() => {
        console.log(`[Cart API] Response Status: ${response.status}`)
        console.log(`[Cart API] Response: [Unable to parse JSON]`)
      })
    }

    if (!response.ok) {
      if (response.status === 403) {
        // Log auth details for debugging
        if (process.env.NODE_ENV === "development") {
          console.error("403 Forbidden - Auth details:", {
            hasApiKey: !!auth.apiKey,
            hasApiSecret: !!auth.apiSecret,
            hasSid: !!auth.sid,
            endpoint,
            baseUrl,
            authHeader: headers.get("Authorization") ? "present" : "missing",
          })
        }
        throw new ApiError(response.status, "Authentication failed. Please login again.")
      }
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }

    return response.json()
  },
}
