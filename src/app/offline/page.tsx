import { BookOpen, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tint-sky mb-6">
        <WifiOff className="h-8 w-8 text-info" />
      </div>
      <h1 className="font-display text-heading-1 font-medium text-ink mb-2">
        You&apos;re offline
      </h1>
      <p className="text-body text-slate text-center max-w-md">
        Finna Renewer needs an internet connection to access your library
        account. Please check your connection and try again.
      </p>
    </div>
  );
}
