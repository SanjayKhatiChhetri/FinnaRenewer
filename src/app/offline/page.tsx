import { OfflineIllustration } from "@/components/shared/illustrations";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4 paper-grain">
      <OfflineIllustration className="mb-6 w-48" />
      <h1 className="mb-2 font-display text-heading-1 font-medium text-ink">
        You&apos;re offline
      </h1>
      <p className="max-w-md text-center text-body text-slate text-pretty">
        Finna Renewer needs an internet connection to reach your library
        account. Check your connection and the shelf will be right back.
      </p>
    </div>
  );
}
