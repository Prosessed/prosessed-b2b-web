import { headers } from "next/headers"
import {
  getDefaultTenant,
  getHostFromHeaders,
  getTenantByHost,
  getTenantById,
  getTenantFromHeaders,
} from "./lookup"
import { TENANT_ID_HEADER, type TenantConfig } from "./types"

export {
  normalizeHost,
  getHostFromHeaders,
  getHostCandidatesFromHeaders,
  getTenantByHost,
  getTenantById,
  getTenantFromHeaders,
} from "./lookup"

export const getTenantFromRequest = async (): Promise<TenantConfig> => {
  const headerList = await headers()
  const tenantId = headerList.get(TENANT_ID_HEADER)
  const byId = getTenantById(tenantId)
  if (byId) return byId

  const byHost = getTenantFromHeaders(headerList)
  if (byHost) return byHost

  // Unlisted domains behave exactly like the app did before white-labeling.
  const defaultTenant = getDefaultTenant()
  if (defaultTenant) return defaultTenant

  const host = getHostFromHeaders(headerList)
  throw new Error(`No tenant configured for host: ${host || "(empty)"}`)
}

export const tryGetTenantFromRequest = async (): Promise<TenantConfig | null> => {
  try {
    return await getTenantFromRequest()
  } catch {
    return null
  }
}
