function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-hairline-soft ${className}`} />
  );
}

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-32 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg bg-surface p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-10" />
          </div>
        ))}
      </div>

      {/* Loan cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-14" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-hairline bg-canvas p-4"
          >
            <div className="flex gap-4">
              <Skeleton className="w-16 h-22 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
