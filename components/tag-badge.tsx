"use client"

import Link from "next/link"

interface TagBadgeProps {
  tag: string
  /** If true, badge is a link to /products?tag=<tag>. Default true for card overlay. */
  href?: boolean
  /** "overlay" = top-left card stamp (grocery-style); "chip" = inline chip near title */
  variant?: "overlay" | "chip"
  className?: string
}

export function TagBadge({ tag, href: asLink = true, variant = "overlay", className = "" }: TagBadgeProps) {
  const baseOverlay =
    "inline-block px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide text-left leading-tight shadow-sm border border-white/35 bg-black/55 text-white/95 backdrop-blur-[2px]"
  const baseChip =
    "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/50 transition-colors"

  const classNames = variant === "overlay" ? baseOverlay : baseChip

  const content = (
    <span
      className={`${classNames} ${className}`}
      role={asLink ? undefined : "status"}
      aria-label={asLink ? `View products tagged ${tag}` : undefined}
    >
      {tag}
    </span>
  )

  if (asLink) {
    return (
      <Link
        href={`/products?tag=${encodeURIComponent(tag)}`}
        className="focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
        tabIndex={0}
      >
        {content}
      </Link>
    )
  }

  return content
}
