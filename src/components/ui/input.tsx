import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-charcoal"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-md border bg-canvas px-4 py-2.5",
            "text-body text-ink placeholder:text-muted",
            "border-hairline-strong",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
            "transition-colors",
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-micro text-error mt-1">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
