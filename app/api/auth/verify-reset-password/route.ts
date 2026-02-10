import { NextRequest, NextResponse } from "next/server"

function getBaseUrl(companyUrl?: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_API_BASE_URL || "https://internal.prosessed.com"
  if (!companyUrl) return fallback
  try {
    const u = new URL(companyUrl)
    return `${u.protocol}//${u.host}`
  } catch {
    return companyUrl.replace(/\/$/, "") || fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : null
    const otp = typeof body.otp === "string" ? body.otp.trim() : null
    const newPassword = typeof body.new_password === "string" ? body.new_password : null
    const baseUrl = getBaseUrl(body.baseUrl ?? body.companyUrl ?? null)

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "Email, OTP and new password are required" },
        { status: 400 }
      )
    }

    const params = new URLSearchParams({
      email,
      otp,
      new_password: newPassword,
    })
    const url = `${baseUrl}/api/method/prosessed_orderit.api.verify_otp_and_reset_password?${params}`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const msg = data?.message?.message ?? data?.message ?? response.statusText
      return NextResponse.json(
        { message: typeof msg === "string" ? msg : "Failed to reset password" },
        { status: response.status }
      )
    }

    const msg = data?.message
    if (msg && typeof msg === "object" && msg.success === false) {
      return NextResponse.json(
        { message: (msg as any).message || "Failed to reset password" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: (msg as any)?.message || "Password has been reset successfully",
    })
  } catch (e) {
    console.error("[verify-reset-password]", e)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
