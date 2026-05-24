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
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56 mb-2" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40 mt-1" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-20 rounded-lg" />
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="rounded-lg border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52 mt-1" />
            </div>
          </div>
          <div className="rounded-md bg-surface px-4 py-3">
            <Skeleton className="h-5 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
