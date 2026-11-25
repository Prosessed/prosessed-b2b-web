import { headers } from "next/headers"
import {
  getDefaultTenant,
  getHostFromHeaders,
  getTenantByHost,
  getTenantById,
} from "./lookup"
import { TENANT_ID_HEADER, type TenantConfig } from "./types"

export {
  normalizeHost,
  getHostFromHeaders,
  getTenantByHost,
  getTenantById,
} from "./lookup"

export const getTenantFromRequest = async (): Promise<TenantConfig> => {
  const headerList = await headers()
  const tenantId = headerList.get(TENANT_ID_HEADER)
  const byId = getTenantById(tenantId)
  if (byId) return byId

  const host = getHostFromHeaders(headerList)
  const byHost = getTenantByHost(host)
  if (byHost) return byHost

  // Unlisted domains behave exactly like the app did before white-labeling.
  const defaultTenant = getDefaultTenant()
  if (defaultTenant) return defaultTenant

  throw new Error(`No tenant configured for host: ${host || "(empty)"}`)
}

export const tryGetTenantFromRequest = async (): Promise<TenantConfig | null> => {
  try {
    return await getTenantFromRequest()
  } catch {
    return null
  }
}
