"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  name?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  name,
  disabled,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          checked ? "bg-primary" : "bg-hairline-strong"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      {name && (
        <input type="hidden" name={name} value={checked ? "on" : "off"} />
      )}
      {(label || description) && (
        <div className="pt-0.5">
          {label && (
            <span className="text-body-sm font-medium text-charcoal">
              {label}
            </span>
          )}
          {description && (
            <p className="text-micro text-steel mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
