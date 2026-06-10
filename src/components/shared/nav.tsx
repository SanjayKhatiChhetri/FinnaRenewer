"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  Clock,
  Wallet,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account", label: "Account", icon: Wallet },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-hairline bg-canvas">
      {/* Brand */}
      <div className="group flex items-center gap-3 px-6 py-5 border-b border-hairline-soft">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft transition-transform duration-200 ease-out-quart group-hover:-rotate-6 group-hover:scale-105 motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-display text-body font-medium text-ink">
            Finna Renewer
          </p>
          <p className="text-micro text-steel">Library assistant</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-md text-body-sm font-medium transition-colors duration-150",
                active
                  ? "bg-primary-soft text-primary-deep"
                  : "text-slate hover:bg-surface hover:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-transform duration-200 ease-out-quart motion-reduce:transition-none",
                  !active && "group-hover:scale-110 motion-reduce:group-hover:scale-100",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-hairline-soft px-3 py-4">
        <div className="flex items-center justify-between px-3">
          <Link
            href="/profile"
            className="min-w-0 flex items-center gap-2 text-body-sm font-medium text-charcoal hover:text-primary transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{userName ?? "User"}</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-md text-steel hover:text-error hover:bg-error-soft transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-canvas px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-body-sm font-medium text-ink">
            Finna Renewer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            className="p-1.5 rounded-md text-steel hover:text-primary transition-colors"
            title="Profile"
          >
            <User className="h-4 w-4" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-md text-steel hover:text-error transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-hairline bg-canvas md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150",
                active ? "text-primary" : "text-steel",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 ease-out-quart",
                  active && "-translate-y-0.5 motion-reduce:translate-y-0",
                )}
              />
              {label}
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-opacity duration-200",
                  active ? "bg-primary opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
