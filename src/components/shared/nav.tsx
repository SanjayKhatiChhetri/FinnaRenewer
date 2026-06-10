"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Wallet,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ExLibris } from "@/components/shared/illustrations";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account", label: "Account", icon: Wallet },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-hairline bg-canvas">
      {/* Brand */}
      <div className="group flex items-center gap-3 px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <ExLibris className="h-9 w-9 shrink-0 transition-transform duration-300 ease-out-quart group-hover:-rotate-6 motion-reduce:group-hover:rotate-0" />
          <div className="leading-tight">
            <p className="font-display text-body-lg font-medium text-ink">
              Finna Renewer
            </p>
            <p className="text-micro text-steel">The reading room</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-body-sm font-medium transition-colors duration-150",
                active
                  ? "text-primary-deep"
                  : "text-slate hover:bg-surface hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-primary-soft"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-[18px] w-[18px] transition-transform duration-200 ease-out-quart motion-reduce:transition-none",
                  !active &&
                    "group-hover:scale-110 motion-reduce:group-hover:scale-100",
                )}
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-hairline-soft px-3 py-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <Link
            href="/profile"
            className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-body-sm font-medium text-charcoal transition-colors hover:text-primary-deep"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
              <User className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{userName ?? "Reader"}</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-pill p-2 text-steel transition-colors hover:bg-error-soft hover:text-error"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-(--z-sticky) flex items-center justify-between border-b border-hairline bg-canvas/85 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ExLibris className="h-8 w-8" />
          <span className="font-display text-body font-medium text-ink">
            Finna Renewer
          </span>
        </Link>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <Link
            href="/profile"
            className="rounded-pill p-2 text-steel transition-colors hover:text-primary-deep"
            title={userName ?? "Profile"}
          >
            <User className="h-4 w-4" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-pill p-2 text-steel transition-colors hover:text-error"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-(--z-sticky) flex border-t border-hairline bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-micro font-medium transition-colors duration-150",
                active ? "text-primary-deep" : "text-steel",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute inset-x-5 top-0 h-0.5 rounded-pill bg-primary"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 ease-out-quart",
                  active && "-translate-y-0.5 motion-reduce:translate-y-0",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
