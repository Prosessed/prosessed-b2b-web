

import type { Company, LoginResponse } from "../auth/types"

/* ============================================================
   CONFIG
============================================================ */

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

const COMPANY_FETCH_BASE_URL = "https://internal.prosessed.com"
const FRAPPE_API_TOKEN = "f53b798f9a6d54f:f863ed6ae78da94"

let currentBaseUrl = ""

/* ============================================================
   TYPES
============================================================ */

interface AuthCredentials {
  apiKey?: string | null
  apiSecret?: string | null
  sid?: string | null
}

export interface B2bRegistrationPayload {
  company_name: string
  contact_person: string
  email: string
  phone: string
  gst_number: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  country: string
  pincode: string
}

/* ============================================================
   AUTH HELPERS (TOKEN ONLY)
============================================================ */

const getAuthFromStorage = (): AuthCredentials => {
  if (typeof window === "undefined") return {}

  try {
    // AuthProvider (current implementation)
    const rawUser = localStorage.getItem("prosessed_auth")
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser)

      // Only use sid when the client-side session is still valid.
      const rawSession = localStorage.getItem("prosessed_session")
      if (rawSession) {
        const session = JSON.parse(rawSession)
        if (typeof session?.sid === "string" && typeof parsedUser?.sid === "string") {
          if (session.sid !== parsedUser.sid) return {}
        }
      }

      return {
        apiKey: parsedUser?.apiKey ?? null,
        apiSecret: parsedUser?.apiSecret ?? null,
        sid: parsedUser?.sid ?? null,
      }
    }

    // Legacy Zustand store (if still present)
    const rawLegacy = localStorage.getItem("auth-storage")
    if (!rawLegacy) return {}

    const parsed = JSON.parse(rawLegacy)
    const state = parsed?.state

    return {
      apiKey: state?.apiKey || null,
      apiSecret: state?.apiSecret || null,
      sid: state?.sid || null,
    }
  } catch {
    return {}
  }
}

/* ============================================================
   BASE URL HELPERS
============================================================ */

export const setApiBaseUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    currentBaseUrl = `${parsed.protocol}//${parsed.host}`
  } catch {
    currentBaseUrl = url.replace(/\/$/, "")
  }
}

export const getApiBaseUrl = () => {
  return currentBaseUrl || DEFAULT_BASE_URL
}

/* ============================================================
   ERROR CLASS
============================================================ */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

/* ============================================================
   LOGGER (DEV ONLY)
============================================================ */

const isDev = process.env.NODE_ENV === "development"

const sanitizeHeaders = (headers?: HeadersInit) => {
  if (!headers) return headers
  const h = new Headers(headers)
  if (h.has("Authorization")) {
    const value = h.get("Authorization") || ""
    if (value.toLowerCase().startsWith("bearer")) {
      h.set("Authorization", "Bearer ***")
    } else {
      h.set("Authorization", "token ***:***")
    }
  }
  return Object.fromEntries(h.entries())
}

const apiLogger = {
  request(method: string, url: string, headers?: HeadersInit, body?: any) {
    if (!isDev) return
    console.groupCollapsed(
      `%c[API →] ${method} ${url}`,
      "color:#2563eb;font-weight:bold"
    )
    console.log("Headers:", sanitizeHeaders(headers))
    if (body) console.log("Body:", body)
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
        credentials: "omit", // 🔥 NEVER send cookies
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

  /* ------------------ Login (Custom API) ------------------ */
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
        auth: {}, // no token for login
      }
    )

    if (data.message.success_key !== 1) {
      throw new ApiError(401, data.message.message || "Authentication failed")
    }

    return data
  },

  /* ------------------ OTP Login ------------------ */
  async requestLoginOtp(email: string, companyUrl: string): Promise<{ success: boolean; message: string }> {
    setApiBaseUrl(companyUrl)
    const data = await this.request<{ success?: boolean; message?: string }>(
      "/api/method/prosessed_orderit.auth.generate_and_send_otp",
      {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: {},
      }
    )
    const success = data?.success ?? true
    const message =
      typeof data?.message === "string" ? data.message : "OTP sent to your email"
    return { success: Boolean(success), message }
  },

  async resendLoginOtp(email: string, companyUrl: string): Promise<{ success: boolean; message: string }> {
    setApiBaseUrl(companyUrl)
    const data = await this.request<{ success?: boolean; message?: string }>(
      "/api/method/prosessed_orderit.auth.resend_otp",
      {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: {},
      }
    )
    const success = data?.success ?? true
    const message =
      typeof data?.message === "string" ? data.message : "New OTP sent"
    return { success: Boolean(success), message }
  },

  async loginWithOtp(
    email: string,
    otpCode: string,
    companyUrl: string
  ): Promise<LoginResponse> {
    setApiBaseUrl(companyUrl)
    const data = await this.request<LoginResponse>(
      "/api/method/prosessed_orderit.auth.verify_otp_and_login",
      {
        method: "POST",
        body: JSON.stringify({ email, otp_code: otpCode }),
        auth: {},
      }
    )
    if (data.message.success_key !== 1) {
      throw new ApiError(401, data.message.message || "Authentication failed")
    }
    return data
  },

  /* ------------------ Company details (branding) ------------------ */
  async getCompanyDetails(): Promise<{
    company_name: string
    company_currency: string
    abn: string
    mobile: string
    email: string
    website: string
    address: string
  }> {
    const data = await this.request<{
      message?: Record<string, string>
    }>("/api/method/prosessed_orderit.api.get_company_details", {
      method: "GET",
      auth: {},
    })
    const msg = data?.message ?? (data as Record<string, string>)
    return {
      company_name: msg?.company_name ?? "",
      company_currency: msg?.company_currency ?? "",
      abn: msg?.abn ?? "",
      mobile: msg?.mobile ?? "",
      email: msg?.email ?? "",
      website: msg?.website ?? "",
      address: msg?.address ?? "",
    }
  },

  /* ------------------ Generic Request ------------------ */
  async request<T>(
    endpoint: string,
    options: RequestInit & { auth?: AuthCredentials } = {}
  ): Promise<T> {
    const baseUrl = getApiBaseUrl()
    const auth = options.auth ?? getAuthFromStorage()
    const url = `${baseUrl}${endpoint}`
    const method = options.method || "GET"

    const headers = new Headers({
      "Content-Type": "application/json",
    })

    if (options.headers) {
      new Headers(options.headers).forEach((v, k) => headers.set(k, v))
    }

    const sid = typeof auth.sid === "string" ? auth.sid.trim() : ""
    const useBearerAuth = sid.length > 0
    const useTokenAuth = auth.apiKey && auth.apiSecret

    if (useBearerAuth) {
      headers.set("Authorization", `Bearer ${sid}`)
    } else if (useTokenAuth) {
      headers.set("Authorization", `token ${auth.apiKey}:${auth.apiSecret}`)
    }

    apiLogger.request(method, url, headers, options.body)

    const start = performance.now()

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body,
        signal: options.signal,
        credentials: "omit", // 🔥 Always omit to avoid CSRF/session
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



  /* ------------------ Generic Blob Request (PDF) ------------------ */
  async requestBlob(
    endpoint: string,
    options: RequestInit & { auth?: AuthCredentials } = {}
  ): Promise<{ blob: Blob; contentType: string; filename?: string }> {
    const baseUrl = getApiBaseUrl()
    const auth = options.auth ?? getAuthFromStorage()
    const url = `${baseUrl}${endpoint}`
    const method = options.method || "GET"

    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/pdf, application/octet-stream, */*",
    })

    if (options.headers) {
      new Headers(options.headers).forEach((v, k) => headers.set(k, v))
    }

    const sid = typeof auth.sid === "string" ? auth.sid.trim() : ""
    const useBearerAuth = sid.length > 0
    const useTokenAuth = auth.apiKey && auth.apiSecret

    if (useBearerAuth) {
      headers.set("Authorization", `Bearer ${sid}`)
    } else if (useTokenAuth) {
      headers.set("Authorization", `token ${auth.apiKey}:${auth.apiSecret}`)
    }

    apiLogger.request(method, url, headers, options.body)
    const start = performance.now()

    try {
      const resp = await fetch(url, {
        method,
        headers,
        body: options.body,
        signal: options.signal,
        credentials: "omit",
      })
      const timeMs = Math.round(performance.now() - start)

      if (!resp.ok) {
        let errMsg = resp.statusText
        try {
          const errJson = await resp.clone().json()
          errMsg = errJson?.message || JSON.stringify(errJson)
        } catch {}
        apiLogger.response(url, resp.status, errMsg, timeMs)
        throw new ApiError(resp.status, errMsg)
      }

      const contentType = resp.headers.get("content-type") || ""
      const contentDisposition = resp.headers.get("content-disposition") || ""
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)
      const filename = filenameMatch?.[1]
        ? decodeURIComponent(filenameMatch[1].replace(/\"/g, ""))
        : undefined

      const blob = await resp.blob()
      apiLogger.response(url, resp.status, `[${contentType}] blob (${blob.size} bytes)`, timeMs)
      return { blob, contentType, filename }
    } catch (err) {
      const timeMs = Math.round(performance.now() - start)
      apiLogger.error(url, err, timeMs)
      throw err
    }
  },

  /* ------------------ Statements ------------------ */
  /**
   * POST `prosessed_orderit.orderit.get_customer_statement_url`.
   * Server resolves the Customer by **customer_name** (`Customer.customer_name`), not by document name.
   * Pass the display name from `useCustomerName` (same value as `customer` / `customerName` in form_dict / JSON).
   */
  async getCustomerStatementUrl(
    customerName: string,
    startDate: string,
    endDate: string
  ): Promise<{ url: string; blob?: Blob; contentType: string }> {
    const c = typeof customerName === "string" ? customerName.trim() : ""
    const start = typeof startDate === "string" ? startDate.trim() : ""
    const end = typeof endDate === "string" ? endDate.trim() : ""

    if (!c || !start || !end) {
      throw new ApiError(400, "Customer name and date range are required.")
    }

    const baseUrl = getApiBaseUrl()
    const auth = getAuthFromStorage()
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/pdf, application/json, application/octet-stream, */*",
    })
    const sid = typeof auth.sid === "string" ? auth.sid.trim() : ""
    if (sid.length > 0) {
      headers.set("Authorization", `Bearer ${sid}`)
    } else if (auth.apiKey && auth.apiSecret) {
      headers.set("Authorization", `token ${auth.apiKey}:${auth.apiSecret}`)
    }

    const endpoint = `${baseUrl}/api/method/prosessed_orderit.orderit.get_customer_statement_url`
    const body = JSON.stringify({
      customer: c,
      customerName: c,
      start_date: start,
      end_date: end,
      startDate: start,
      endDate: end,
    })

    apiLogger.request("POST", endpoint, headers, { customer: c, start_date: start, end_date: end })

    const t0 = performance.now()
    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      credentials: "omit",
    })
    const elapsed = Math.round(performance.now() - t0)

    if (!resp.ok) {
      let errMsg = resp.statusText
      try {
        const errJson = await resp.json()
        errMsg =
          (typeof errJson?.message === "string" && errJson.message) ||
          (typeof errJson?.exc === "string" && errJson.exc) ||
          JSON.stringify(errJson)
      } catch {
        /* keep statusText */
      }
      apiLogger.response(endpoint, resp.status, errMsg, elapsed)
      if (resp.status === 403) {
        throw new ApiError(403, "Authentication failed. Please login again.")
      }
      throw new ApiError(resp.status, errMsg)
    }

    const ct = resp.headers.get("content-type") || ""
    apiLogger.response(endpoint, resp.status, `[${ct}]`, elapsed)

    if (
      ct.includes("application/pdf") ||
      ct.includes("application/octet-stream") ||
      ct.includes("application/x-pdf")
    ) {
      const blob = await resp.blob()
      return { url: URL.createObjectURL(blob), blob, contentType: ct }
    }

    let parsed: { message?: unknown }
    try {
      parsed = await resp.json()
    } catch {
      throw new ApiError(502, "Invalid response from statement service.")
    }

    const msg = parsed.message

    if (typeof msg === "string") {
      const s = msg.trim()
      if (/^https?:\/\//i.test(s)) {
        return { url: s, contentType: "application/pdf" }
      }
      throw new ApiError(400, s)
    }

    if (
      msg &&
      typeof msg === "object" &&
      "url" in msg &&
      typeof (msg as { url: unknown }).url === "string"
    ) {
      const m = msg as { url: string; contentType?: string }
      return { url: m.url, contentType: m.contentType || ct || "application/json" }
    }

    throw new ApiError(502, "Unexpected statement response from server.")
  },

  /* ------------------ B2B registration (public, no auth) ------------------ */
  async createB2bRegistration(
    payload: B2bRegistrationPayload,
    companyUrl?: string | null
  ): Promise<{ message?: unknown }> {
    const trimmed = typeof companyUrl === "string" ? companyUrl.trim() : ""
    if (trimmed) {
      setApiBaseUrl(trimmed)
    }

    return this.request<{ message?: unknown }>(
      "/api/method/prosessed_order.api.create_b2b_registration",
      {
        method: "POST",
        body: JSON.stringify(payload),
        auth: {},
      }
    )
  },
}
