export function CategoryGridSkeleton() {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 animate-pulse"
          >
            <div className="h-20 w-20 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }
