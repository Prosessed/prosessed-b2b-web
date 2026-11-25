import { tenants } from "./tenants"
import type { TenantConfig } from "./types"

const hostToTenant = new Map<string, TenantConfig>()
const idToTenant = new Map<string, TenantConfig>()

for (const tenant of tenants) {
  if (tenant.status === "inactive") continue
  idToTenant.set(tenant.id, tenant)
  for (const domain of tenant.domains) {
    hostToTenant.set(domain.toLowerCase(), tenant)
  }
}

export const normalizeHost = (raw: string | null | undefined): string => {
  if (!raw) return ""
  const first = raw.split(",")[0]?.trim() ?? ""
  return first.split(":")[0]?.trim().toLowerCase() ?? ""
}

export const getHostCandidatesFromHeaders = (
  headerBag: Headers | { get(name: string): string | null }
): string[] => {
  const candidates = [
    normalizeHost(headerBag.get("x-forwarded-host")),
    normalizeHost(headerBag.get("host")),
  ].filter(Boolean)

  return [...new Set(candidates)]
}

export const getHostFromHeaders = (
  headerBag: Headers | { get(name: string): string | null }
): string => getHostCandidatesFromHeaders(headerBag)[0] ?? ""

export const getTenantByHost = (host: string): TenantConfig | null => {
  const normalized = normalizeHost(host)
  if (!normalized) return null
  return hostToTenant.get(normalized) ?? null
}

/** Prefer a host that matches a configured tenant; otherwise first candidate. */
export const getTenantFromHeaders = (
  headerBag: Headers | { get(name: string): string | null }
): TenantConfig | null => {
  const candidates = getHostCandidatesFromHeaders(headerBag)
  for (const host of candidates) {
    const tenant = getTenantByHost(host)
    if (tenant) return tenant
  }
  return null
}

export const getDefaultTenant = (): TenantConfig | null =>
  tenants.find((tenant) => tenant.isDefault && tenant.status !== "inactive") ?? null

export const getTenantById = (id: string | null | undefined): TenantConfig | null => {
  if (!id) return null
  return idToTenant.get(id) ?? null
}
