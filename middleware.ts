import { NextResponse, type NextRequest } from "next/server"
import {
  getDefaultTenant,
  getHostFromHeaders,
  getTenantByHost,
} from "@/lib/brand/lookup"
import { TENANT_ID_HEADER } from "@/lib/brand/types"

const STATIC_EXT =
  /\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|map|txt|xml|woff2?|ttf|eot|json)$/i

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brands/") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/icon.svg" ||
    STATIC_EXT.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Unlisted domains fall back to the default tenant so they behave exactly as before.
  const host = getHostFromHeaders(request.headers)
  const tenant = getTenantByHost(host) ?? getDefaultTenant()

  if (!tenant) return NextResponse.next()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(TENANT_ID_HEADER, tenant.id)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and common static assets.
     * Extra skips also happen inside middleware for safety.
     */
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|map|txt|xml|woff2?|ttf|eot)$).*)",
  ],
}
