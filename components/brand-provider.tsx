"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { TenantBranding, TenantConfig } from "@/lib/brand/types"

type BrandContextValue = {
  tenantId: string
  tenantName: string
  branding: TenantBranding
  features: Record<string, boolean>
  /** True for the default tenant, which keeps the original (pre white-label) UI. */
  isDefault: boolean
}

const BrandContext = createContext<BrandContextValue | null>(null)

export const BrandProvider = ({
  tenant,
  children,
}: {
  tenant: TenantConfig
  children: ReactNode
}) => {
  const value: BrandContextValue = {
    tenantId: tenant.id,
    tenantName: tenant.name,
    branding: tenant.branding,
    features: tenant.features ?? {},
    isDefault: Boolean(tenant.isDefault),
  }

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export const useBrand = (): BrandContextValue => {
  const ctx = useContext(BrandContext)
  if (!ctx) {
    throw new Error("useBrand must be used within BrandProvider")
  }
  return ctx
}

export const useBrandOptional = (): BrandContextValue | null =>
  useContext(BrandContext)
