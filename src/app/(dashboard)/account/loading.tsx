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
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg bg-surface p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>

      {/* Holds card */}
      <div className="rounded-lg border border-hairline bg-canvas p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-28 mt-1" />
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-md bg-surface px-4 py-3 mb-3">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      {/* Fines card */}
      <div className="rounded-lg border border-hairline bg-canvas p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="rounded-md bg-surface px-4 py-3">
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
}
