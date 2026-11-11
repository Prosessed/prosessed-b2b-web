import { isAllowedProsessedOrigin } from "@/lib/utils/tenant-url"
import { NextRequest, NextResponse } from "next/server"

const buildTargetUrl = (req: NextRequest, pathParts: string[], origin: string): string => {
  const rawPath = `/${pathParts.join("/")}`
  const search = req.nextUrl.search || ""
  return `${origin.replace(/\/$/, "")}${rawPath}${search}`
}

const forward = async (req: NextRequest, pathParts: string[]) => {
  const origin = req.headers.get("x-proxy-origin")
  if (!isAllowedProsessedOrigin(origin)) {
    return NextResponse.json({ message: "Proxy origin not allowed" }, { status: 403 })
  }

  if (!pathParts.length) {
    return NextResponse.json({ message: "Missing path" }, { status: 400 })
  }

  const targetUrl = buildTargetUrl(req, pathParts, origin)
  const headers = new Headers()

  const authorization = req.headers.get("authorization")
  if (authorization) headers.set("Authorization", authorization)

  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)

  const accept = req.headers.get("accept")
  if (accept) headers.set("Accept", accept)

  const method = req.method.toUpperCase()
  const hasBody = method !== "GET" && method !== "HEAD"
  const body = hasBody ? await req.arrayBuffer() : undefined

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    })

    const responseHeaders = new Headers()
    const upstreamContentType = upstream.headers.get("content-type")
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType)

    const contentDisposition = upstream.headers.get("content-disposition")
    if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition)

    const buffer = await upstream.arrayBuffer()
    return new NextResponse(buffer, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[api/proxy]", targetUrl, error)
    return NextResponse.json({ message: "Upstream request failed" }, { status: 502 })
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(req, path)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(req, path)
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(req, path)
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(req, path)
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return forward(req, path)
}
