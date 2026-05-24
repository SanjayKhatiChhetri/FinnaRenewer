function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-hairline-soft ${className}`} />
  );
}

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>

      <div className="space-y-6">
        {/* Library Cards section */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36 mt-1" />
            </div>
          </div>
          <div className="rounded-md bg-surface px-4 py-3 mb-3">
            <Skeleton className="h-5 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Notifications section */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <Skeleton className="h-5 w-28 mb-1" />
          <Skeleton className="h-4 w-52 mb-4" />
          <Skeleton className="h-11 w-full mb-4" />
          <div className="border-t border-hairline-soft pt-4">
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        {/* Preferences section */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
