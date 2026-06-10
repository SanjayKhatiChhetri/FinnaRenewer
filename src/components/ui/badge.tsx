import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center font-medium text-caption", {
  variants: {
    variant: {
      default: "bg-surface text-charcoal rounded-sm px-2 py-0.5",
      success: "bg-success-soft text-success-deep rounded-sm px-2 py-0.5",
      warning: "bg-warning-soft text-warning-deep rounded-sm px-2 py-0.5",
      error: "bg-error-soft text-error-deep rounded-sm px-2 py-0.5",
      info: "bg-info-soft text-info-deep rounded-sm px-2 py-0.5",
      purple: "bg-primary-soft text-primary-deep rounded-sm px-2 py-0.5",
      pill: "bg-primary text-on-primary rounded-pill px-2.5 py-0.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
