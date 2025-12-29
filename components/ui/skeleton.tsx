import type React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-md",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
