import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover rounded-pill shadow-xs",
        secondary:
          "bg-transparent text-ink border border-hairline-strong hover:bg-surface rounded-md",
        ghost:
          "bg-transparent text-ink hover:bg-surface rounded-md",
        danger:
          "bg-error text-white hover:bg-error/90 rounded-pill shadow-xs",
        link:
          "bg-transparent text-primary hover:text-primary-hover underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-body-sm",
        md: "h-10 px-5 text-body-sm",
        lg: "h-12 px-6 text-body",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
