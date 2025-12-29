import { Card, CardContent } from "@/components/ui/card"

export function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-border/50 rounded-2xl">
      <div className="relative aspect-square bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]" />
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-lg" />
          <div className="h-4 w-1/2 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-lg" />
        </div>
        <div className="h-3 w-1/4 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-lg" />
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="h-6 w-16 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-lg" />
          </div>
          <div className="h-9 w-20 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonProductRow() {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded" />
        <div className="h-6 w-20 bg-muted/60 animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%] rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  )
}
