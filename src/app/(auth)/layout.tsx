import Link from "next/link";
import { ExLibris } from "@/components/shared/illustrations";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4 paper-grain">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="group mb-8 flex items-center gap-2.5">
        <ExLibris className="h-10 w-10 transition-transform duration-300 ease-out-quart group-hover:-rotate-6 motion-reduce:group-hover:rotate-0" />
        <span className="font-display text-heading-2 font-medium text-ink">
          Finna Renewer
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-caption text-steel">
        Your library card, looked after.
      </p>
    </div>
  );
}
