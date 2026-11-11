

import type { Company, LoginResponse } from "../auth/types"
import { assertAllowedProsessedOrigin, isAllowedProsessedOrigin } from "../utils/tenant-url"

/* ============================================================
   CONFIG
============================================================ */

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"

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
  portal_link: string
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
  // Fail closed: never point the API client at a non-Prosessed host.
  currentBaseUrl = assertAllowedProsessedOrigin(url)
}

export const getApiBaseUrl = () => {
  return currentBaseUrl || DEFAULT_BASE_URL
}

/** Browser origins that are not allowlisted by tenant CORS need a same-origin proxy. */
const needsApiProxy = (): boolean => {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") return true
  if (
    host.endsWith(".ngrok-free.dev") ||
    host.endsWith(".ngrok-free.app") ||
    host.endsWith(".ngrok.io") ||
    host.endsWith(".loca.lt")
  ) {
    return true
  }
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true
  return false
}

const proxyAwareFetch = (absoluteUrl: string, init?: RequestInit): Promise<Response> => {
  let parsed: URL
  try {
    parsed = new URL(absoluteUrl)
  } catch {
    return Promise.reject(new Error("Invalid API URL"))
  }

  if (!isAllowedProsessedOrigin(parsed.origin)) {
    return Promise.reject(new Error("Company URL is not an allowed Prosessed host"))
  }

  if (!needsApiProxy()) {
    return fetch(absoluteUrl, init)
  }

  const headers = new Headers(init?.headers)
  headers.set("x-proxy-origin", parsed.origin)

  return fetch(`/api/proxy${parsed.pathname}${parsed.search}`, {
    ...init,
    headers,
  })
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

let unauthorizedHandler: (() => void) | null = null

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler
}

const notifyUnauthorized = (status: number, hadAuth: boolean) => {
  if (status === 401 && hadAuth && unauthorizedHandler) {
    unauthorizedHandler()
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
   DOMAIN-SCOPED COMPANY FILTERING
============================================================ */

/** First hostname label of a company_url, e.g. "https://oasis.prosessed.com/app" → "oasis". */
const companySlug = (companyUrl: string): string => {
  try {
    return new URL(companyUrl).hostname.split(".")[0]?.toLowerCase() ?? ""
  } catch {
    return ""
  }
}

/**
 * The same email/mobile number can be linked to unrelated companies across
 * tenants (e.g. an internal user with access to Joyco, Oasis, Desitouch...).
 * A customer logging in from a company's own branded portal domain
 * (store.oasisfoods.com.au) should only see that company, not the full list.
 *
 * There's no explicit "portal domain" field on the company record to match
 * against, so we match by substring: does the company's slug (from its
 * company_url) appear in the current browser hostname? If nothing matches —
 * e.g. the generic un-branded portal domain, or local/dev testing — fall
 * back to the unfiltered list rather than risk locking someone out.
 */
const filterCompaniesByCurrentDomain = (companies: Company[]): Company[] => {
  if (typeof window === "undefined" || companies.length <= 1) return companies

  const host = window.location.hostname.toLowerCase()
  const matches = companies.filter((c) => {
    const slug = companySlug(c.company_url)
    return slug.length > 0 && host.includes(slug)
  })

  return matches.length > 0 ? matches : companies
}

/* ============================================================
   API CLIENT
============================================================ */

export const apiClient = {
  /* ------------------ Fetch Companies (via Next.js server; token stays server-side) ------------------ */
  async getCompaniesByEmail(email: string): Promise<Company[]> {
    const response = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "same-origin",
    })

    let result: { companies?: Company[]; message?: string } = {}
    try {
      result = await response.json()
    } catch {
      /* ignore */
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        typeof result.message === "string" ? result.message : response.statusText
      )
    }

    const companies = Array.isArray(result.companies) ? result.companies : []
    return filterCompaniesByCurrentDomain(
      companies.filter((c) => isAllowedProsessedOrigin(c.company_url))
    )
  },

  /* ------------------ Fetch Companies (by Mobile) ------------------ */
  async getCompaniesByMobile(mobileNumber: string): Promise<Company[]> {
    const response = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mobileNumber }),
      credentials: "same-origin",
    })

    let result: { companies?: Company[]; message?: string } = {}
    try {
      result = await response.json()
    } catch {
      /* ignore */
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        typeof result.message === "string" ? result.message : response.statusText
      )
    }

    const companies = Array.isArray(result.companies) ? result.companies : []
    return filterCompaniesByCurrentDomain(
      companies.filter((c) => isAllowedProsessedOrigin(c.company_url))
    )
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
          platform: "web",
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

  /* ------------------ Mobile OTP Login ------------------ */
  async requestMobileOtp(mobileNumber: string, companyUrl: string): Promise<{ success: boolean; message: string }> {
    setApiBaseUrl(companyUrl)
    // prosessed_orderit.api.get_otp returns a Frappe-wrapped payload:
    // { message: { success: boolean, channel, status, message } }
    const data = await this.request<{
      message?: { success?: boolean; message?: string }
    }>(
      "/api/method/prosessed_orderit.api.get_otp",
      {
        method: "POST",
        body: JSON.stringify({ mobile_number: mobileNumber }),
        auth: {},
      }
    )
    const success = data?.message?.success ?? false
    const message =
      typeof data?.message?.message === "string"
        ? data.message.message
        : "OTP sent to your mobile number"
    if (!success) {
      throw new ApiError(400, message || "Failed to send OTP")
    }
    return { success: true, message }
  },

  async loginWithMobileOtp(
    mobileNumber: string,
    otp: string,
    companyUrl: string
  ): Promise<LoginResponse> {
    setApiBaseUrl(companyUrl)
    const data = await this.request<LoginResponse>(
      "/api/method/prosessed_orderit.api.login",
      {
        method: "POST",
        body: JSON.stringify({ mobile_number: mobileNumber, otp, platform: "web" }),
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

    const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData
    const headers = new Headers(
      isFormDataBody
        ? undefined
        : {
            "Content-Type": "application/json",
          }
    )

    if (options.headers) {
      new Headers(options.headers).forEach((v, k) => headers.set(k, v))
    }
    // Never set Content-Type manually for FormData; browser must add the boundary.
    if (isFormDataBody) {
      headers.delete("Content-Type")
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
      const response = await proxyAwareFetch(url, {
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
        notifyUnauthorized(response.status, useBearerAuth || Boolean(useTokenAuth))
        const message =
          typeof data?.message === "string"
            ? data.message
            : typeof data?.message?.message === "string"
              ? data.message.message
              : response.statusText
        throw new ApiError(response.status, message)
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
      const resp = await proxyAwareFetch(url, {
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
          errMsg =
            (typeof errJson?.message === "string" && errJson.message) ||
            (typeof errJson?.message?.message === "string" && errJson.message.message) ||
            JSON.stringify(errJson)
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
    const resp = await proxyAwareFetch(endpoint, {
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

  /**
   * B2B registration — posted to our Next.js route; Frappe service token stays server-side.
   */
  async createB2bRegistration(
    payload: B2bRegistrationPayload
  ): Promise<{ message?: unknown }> {
    const debugB2b =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_DEBUG_B2B_REGISTRATION === "1"
    if (debugB2b && typeof window !== "undefined") {
      const safePayload = {
        ...payload,
        email:
          typeof payload.email === "string" && payload.email.includes("@")
            ? payload.email.replace(/(^.).*(@.*$)/, "$1***$2")
            : payload.email,
        phone:
          typeof payload.phone === "string" && payload.phone.length > 4
            ? `${payload.phone.slice(0, 2)}***${payload.phone.slice(-2)}`
            : payload.phone,
      }
      console.groupCollapsed("[B2B] createB2bRegistration")
      console.log("endpoint:", "/api/b2b-registration")
      console.log("payload:", safePayload)
      console.groupEnd()
    }

    const url = "/api/b2b-registration"
    apiLogger.request("POST", url, { "Content-Type": "application/json" }, JSON.stringify(payload))
    const start = performance.now()

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })

      const timeMs = Math.round(performance.now() - start)

      let data: unknown = null
      try {
        data = await response.clone().json()
      } catch {
        data = "[Non-JSON response]"
      }

      apiLogger.response(url, response.status, data, timeMs)

      if (!response.ok) {
        const d = data as Record<string, unknown> | null
        const errMsg =
          (d && typeof d.message === "string" && d.message) ||
          response.statusText ||
          "Registration failed"
        throw new ApiError(response.status, errMsg)
      }

      return data as { message?: unknown }
    } catch (err) {
      const timeMs = Math.round(performance.now() - start)
      apiLogger.error(url, err, timeMs)
      throw err
    }
  },
}
