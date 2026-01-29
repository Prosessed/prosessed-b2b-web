import type { Company, LoginResponse } from "../auth/types"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

const COMPANY_FETCH_BASE_URL = "https://internal.prosessed.com"
const FRAPPE_API_TOKEN = "f53b798f9a6d54f:f863ed6ae78da94"

let currentBaseUrl = ""

interface AuthCredentials {
  sid?: string | null
  apiKey?: string | null
  apiSecret?: string | null
}

/* ============================================================
   Auth Helpers
============================================================ */
const getAuthFromStorage = (): AuthCredentials => {
  if (typeof window === "undefined") return {}

  try {
    const authStorage = localStorage.getItem("auth-storage")
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      const state = parsed?.state
      if (state?.apiKey || state?.sid) {
        return {
          sid: state.sid || null,
          apiKey: state.apiKey || null,
          apiSecret: state.apiSecret || null,
        }
      }
    }
  } catch {}

  try {
    const userStorage = localStorage.getItem("prosessed_auth")
    if (userStorage) {
      const user = JSON.parse(userStorage)
      if (user?.apiKey || user?.sid) {
        return {
          sid: user.sid || null,
          apiKey: user.apiKey || null,
          apiSecret: user.apiSecret || null,
        }
      }
    }
  } catch {}

  return {}
}

/* ============================================================
   Base URL Helpers
============================================================ */
export const setApiBaseUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    currentBaseUrl = `${parsed.protocol}//${parsed.host}`
  } catch {
    currentBaseUrl = url.replace(/\/$/, "")
  }
}

export const getApiBaseUrl = () =>
  currentBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || ""

/* ============================================================
   Errors
============================================================ */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

/* ============================================================
   API Logger (DEV ONLY)
============================================================ */
const isDev = process.env.NODE_ENV === "development"

const sanitizeHeaders = (headers?: HeadersInit) => {
  if (!headers) return headers
  const h = new Headers(headers)
  if (h.has("Authorization")) {
    h.set("Authorization", "token ***:***")
  }
  return Object.fromEntries(h.entries())
}

const safeJsonParse = (value: any) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const apiLogger = {
  request(method: string, url: string, headers?: HeadersInit, body?: any) {
    if (!isDev) return
    console.groupCollapsed(
      `%c[API →] ${method} ${url}`,
      "color:#2563eb;font-weight:bold"
    )
    console.log("Headers:", sanitizeHeaders(headers))
    if (body) console.log("Request Body:", body)
    console.groupEnd()
  },

  response(url: string, status: number, data: any, timeMs: number) {
    if (!isDev) return
    console.groupCollapsed(
      `%c[API ←] ${status} ${url} (${timeMs}ms)`,
      status >= 400
        ? "color:#dc2626;font-weight:bold"
        : "color:#16a34a;font-weight:bold"
    )
    console.log("Response:", data)
    console.groupEnd()
  },

  error(url: string, error: any, timeMs: number) {
    if (!isDev) return
    console.group(
      `%c[API ✖] ${url} (${timeMs}ms)`,
      "color:#dc2626;font-weight:bold"
    )
    console.error(error)
    console.groupEnd()
  },
}

/* ============================================================
   API CLIENT
============================================================ */
export const apiClient = {
  /* ------------------ Fetch Companies ------------------ */
  async getCompaniesByEmail(email: string): Promise<Company[]> {
    const params = new URLSearchParams({
      fields: '["*"]',
      filters: `[["email_id", "=", "${email}"]]`,
    })

    const response = await fetch(
      `${COMPANY_FETCH_BASE_URL}/api/resource/All User Master?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${FRAPPE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText)
    }

    const result = await response.json()
    return (result.data || []).map((item: any) => ({
      company_name: item.company_name || "",
      company_url: item.company_url || "",
    }))
  },

  /* ------------------ Login ------------------ */
  async login(
  email: string,
  password: string,
  companyUrl: string
): Promise<LoginResponse> {
  setApiBaseUrl(companyUrl)

  const data = await this.request<LoginResponse>(
    "/api/method/prosessed_orderit.api.login",
    {
      method: "POST",
      body: JSON.stringify({
        usr: email,
        pwd: password,
      }),
      auth: {}, // login doesn't need auth
    }
  )

  if (data.message.success_key !== 1) {
    throw new ApiError(401, data.message.message || "Authentication failed")
  }

  return data
},

  /* ------------------ Generic Request ------------------ */
  async request<T>(
    endpoint: string,
    options: RequestInit & { auth?: AuthCredentials } = {}
  ): Promise<T> {
    const baseUrl = getApiBaseUrl()
    const auth = options.auth || getAuthFromStorage()
    const method = options.method || "GET"
    const url = `${baseUrl}${endpoint}`

    const headers = new Headers({ "Content-Type": "application/json" })
    if (options.headers) {
      new Headers(options.headers).forEach((v, k) => headers.set(k, v))
    }

    if (auth.apiKey && auth.apiSecret) {
      headers.set("Authorization", `token ${auth.apiKey}:${auth.apiSecret}`)
    }

    const credentials: RequestCredentials =
      auth.apiKey ? "include" : "same-origin"

    const requestBody =
      typeof options.body === "string"
        ? safeJsonParse(options.body)
        : options.body

    const start = performance.now()
    apiLogger.request(method, url, headers, requestBody)

    try {
      const response = await fetch(url, {
        method,
        headers,
        credentials,
        body: options.body,
        signal: options.signal,
      })

      const timeMs = Math.round(performance.now() - start)

      let data: any = null
      try {
        data = await response.clone().json()
      } catch {
        data = "[Non-JSON response]"
      }

      apiLogger.response(url, response.status, data, timeMs)

      if (!response.ok) {
        if (response.status === 403) {
          throw new ApiError(403, "Authentication failed. Please login again.")
        }
        throw new ApiError(
          response.status,
          data?.message || response.statusText
        )
      }

      return data as T
    } catch (err) {
      const timeMs = Math.round(performance.now() - start)
      apiLogger.error(url, err, timeMs)
      throw err
    }
  },
}
