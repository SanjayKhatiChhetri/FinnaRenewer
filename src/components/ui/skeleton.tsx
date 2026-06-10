import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/* Loan-row shaped skeleton — mirrors the loan-card anatomy so the
   loading state matches what resolves in. */
export function LoanRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border border-hairline bg-canvas p-4">
      <Skeleton className="h-28 w-20 shrink-0 rounded-md" />
      <div className="flex-1 space-y-2.5 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}
