"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useBrandOptional } from "@/components/brand-provider"

type TenantLogoProps = {
  className?: string
  /** Pixel size when className does not set width/height. Default 40. */
  size?: number
  /** Prefer text product name instead of image when true. */
  textOnly?: boolean
  priority?: boolean
}

export const TenantLogo = ({
  className,
  size = 40,
  textOnly = false,
  priority = false,
}: TenantLogoProps) => {
  const brand = useBrandOptional()
  const productName = brand?.branding.productName ?? "B2B Commerce"
  const logoUrl = brand?.branding.logoUrl
  const logoAspectRatio = brand?.branding.logoAspectRatio ?? 1

  if (textOnly || !logoUrl) {
    return (
      <span
        className={cn("font-bold truncate text-foreground", className)}
        aria-label={productName}
      >
        {productName}
      </span>
    )
  }

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={
        className
          ? { aspectRatio: logoAspectRatio }
          : { width: size * logoAspectRatio, height: size }
      }
      aria-label={productName}
    >
      <Image
        src={logoUrl}
        alt={productName}
        fill
        className="object-contain"
        priority={priority}
      />
    </span>
  )
}
