import { isAllowedProsessedOrigin } from "@/lib/utils/tenant-url"
import { NextRequest, NextResponse } from "next/server"

/**
 * Same-origin image proxy for local/dev hosts (*.localhost) where the browser
 * cannot load Frappe /files URLs cross-origin the way production does.
 * Only allows Prosessed HTTPS/HTTP origins.
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src")
  if (!src) {
    return NextResponse.json({ message: "Missing src" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(src)
  } catch {
    return NextResponse.json({ message: "Invalid src" }, { status: 400 })
  }

  if (!isAllowedProsessedOrigin(parsed.origin)) {
    return NextResponse.json({ message: "Origin not allowed" }, { status: 403 })
  }

  if (!parsed.pathname.startsWith("/files") && !parsed.pathname.startsWith("/private/files")) {
    return NextResponse.json({ message: "Path not allowed" }, { status: 403 })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      cache: "force-cache",
      headers: { Accept: "image/*,*/*" },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Upstream image failed" },
        { status: upstream.status === 404 ? 404 : 502 }
      )
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream"
    const buffer = await upstream.arrayBuffer()
    const headers = new Headers()
    headers.set("content-type", contentType)
    headers.set("cache-control", "public, max-age=3600")

    return new NextResponse(buffer, { status: 200, headers })
  } catch (error) {
    console.error("[api/media]", parsed.toString(), error)
    return NextResponse.json({ message: "Upstream request failed" }, { status: 502 })
  }
}
