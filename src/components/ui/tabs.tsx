"use client";

import { createContext, useContext, useId, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  className,
  children,
}: {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const layoutId = useId();
  const value = controlled ?? internal;
  const setValue = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value, setValue, layoutId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-hairline bg-surface-soft p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  count,
  children,
}: {
  value: string;
  count?: number;
  children: React.ReactNode;
}) {
  const { value: active, setValue, layoutId } = useTabs();
  const selected = active === value;
  return (
    <button
      role="tab"
      type="button"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-body-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected ? "text-on-primary" : "text-slate hover:text-ink",
      )}
    >
      {selected && (
        <motion.span
          layoutId={`tab-${layoutId}`}
          className="absolute inset-0 rounded-pill bg-primary shadow-xs"
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      )}
      <span className="relative z-10">{children}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "relative z-10 rounded-pill px-1.5 text-micro tabular-nums",
            selected ? "bg-on-primary/20" : "bg-surface text-steel",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: active } = useTabs();
  if (active !== value) return null;
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
