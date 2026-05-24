import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <span className="font-display text-heading-3 font-medium text-ink">
          Finna Renewer
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
