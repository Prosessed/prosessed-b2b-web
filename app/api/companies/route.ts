import { NextRequest, NextResponse } from "next/server"
import {
  fetchCompaniesByEmail,
  fetchCompaniesByMobile,
} from "@/lib/server/frappe-internal"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    const email = typeof body.email === "string" ? body.email.trim() : ""
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : ""

    if (!email && !mobile) {
      return NextResponse.json(
        { message: "Email or mobile is required" },
        { status: 400 }
      )
    }

    if (email && mobile) {
      return NextResponse.json(
        { message: "Provide either email or mobile, not both" },
        { status: 400 }
      )
    }

    const companies = email
      ? await fetchCompaniesByEmail(email)
      : await fetchCompaniesByMobile(mobile)

    return NextResponse.json({ companies })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch companies"
    const isConfigError = message.includes("FRAPPE_API_TOKEN")
    console.error("[api/companies]", error)
    return NextResponse.json(
      { message: isConfigError ? "Company lookup is not configured" : "Failed to fetch companies" },
      { status: isConfigError ? 503 : 502 }
    )
  }
}
