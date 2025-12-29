import { SkeletonCard } from "./skeleton-card"

interface SkeletonRowProps {
  count?: number
}

export function SkeletonRow({ count = 6 }: SkeletonRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
