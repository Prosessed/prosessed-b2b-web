import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface CategoryIconProps {
  name: string
  icon: LucideIcon
  href: string
}

export function CategoryIcon({ name, icon: Icon, href }: CategoryIconProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors min-w-[100px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-xs font-medium text-center">{name}</span>
    </Link>
  )
}
