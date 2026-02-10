import { NextRequest, NextResponse } from "next/server"

function getBaseUrl(companyUrl?: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"
  if (!companyUrl) return fallback
  try {
    const u = new URL(companyUrl)
    return `${u.protocol}//${u.host}`
  } catch {
    const stripped = String(companyUrl).replace(/\/$/, "").replace(/\/app(\/.*)?$/i, "")
    return stripped || fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : null
    const baseUrl = getBaseUrl(body.baseUrl ?? body.companyUrl ?? null)

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const url = `${baseUrl}/api/method/prosessed_orderit.api.request_password_reset_otp?email=${encodeURIComponent(email)}`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const msg = data?.message?.message ?? data?.message ?? response.statusText
      return NextResponse.json(
        { message: typeof msg === "string" ? msg : "Failed to send OTP" },
        { status: response.status }
      )
    }

    const msg = data?.message
    if (msg && typeof msg === "object" && msg.success === false) {
      return NextResponse.json(
        { message: (msg as any).message || "Failed to send OTP" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: (msg as any)?.message || "OTP has been sent to your email address",
    })
  } catch (e) {
    console.error("[request-otp]", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
