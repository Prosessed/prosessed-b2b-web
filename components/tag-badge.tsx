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
    "inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md border-2 border-white/80 bg-primary text-primary-foreground"
  const baseChip =
    "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary/50 transition-colors"

  const style = variant === "overlay" ? { transform: "rotate(-3deg)" } : undefined
  const classNames = variant === "overlay" ? baseOverlay : baseChip

  const content = (
    <span
      className={`${classNames} ${className}`}
      style={style}
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
