import { NextRequest, NextResponse } from "next/server"
import {
  createB2bRegistration,
  FrappeUpstreamError,
  type B2bRegistrationPayload,
} from "@/lib/server/frappe-internal"

const REQUIRED_FIELDS: (keyof B2bRegistrationPayload)[] = [
  "company_name",
  "contact_person",
  "email",
  "phone",
  "portal_link",
  "gst_number",
  "address_line_1",
  "city",
  "state",
  "country",
  "pincode",
]

const asPayload = (body: unknown): B2bRegistrationPayload | null => {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const payload: B2bRegistrationPayload = {
    company_name: typeof o.company_name === "string" ? o.company_name : "",
    contact_person: typeof o.contact_person === "string" ? o.contact_person : "",
    email: typeof o.email === "string" ? o.email : "",
    phone: typeof o.phone === "string" ? o.phone : "",
    portal_link: typeof o.portal_link === "string" ? o.portal_link : "",
    gst_number: typeof o.gst_number === "string" ? o.gst_number : "",
    address_line_1: typeof o.address_line_1 === "string" ? o.address_line_1 : "",
    address_line_2: typeof o.address_line_2 === "string" ? o.address_line_2 : "",
    city: typeof o.city === "string" ? o.city : "",
    state: typeof o.state === "string" ? o.state : "",
    country: typeof o.country === "string" ? o.country : "",
    pincode: typeof o.pincode === "string" ? o.pincode : "",
  }
  return payload
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const payload = asPayload(body)
    if (!payload) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
    }

    for (const key of REQUIRED_FIELDS) {
      if (!payload[key]?.trim()) {
        return NextResponse.json(
          { message: `${key} is required` },
          { status: 400 }
        )
      }
    }

    const result = await createB2bRegistration(payload)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof FrappeUpstreamError) {
      return NextResponse.json({ message: error.message }, { status: error.status || 400 })
    }
    const message =
      error instanceof Error ? error.message : "Registration failed"
    const isConfigError = message.includes("FRAPPE_API_TOKEN")
    console.error("[api/b2b-registration]", error)
    return NextResponse.json(
      {
        message: isConfigError
          ? "Registration is not configured"
          : "Registration failed. Please try again.",
      },
      { status: isConfigError ? 503 : 502 }
    )
  }
}
