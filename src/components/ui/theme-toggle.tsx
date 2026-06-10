"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-pill text-steel",
        "transition-colors hover:bg-surface hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {!mounted ? (
        <Sun className="h-[1.15rem] w-[1.15rem]" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            {isDark ? (
              <Moon className="h-[1.15rem] w-[1.15rem]" />
            ) : (
              <Sun className="h-[1.15rem] w-[1.15rem]" />
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
}
