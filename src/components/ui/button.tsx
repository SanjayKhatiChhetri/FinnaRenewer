import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,box-shadow,color] duration-150 ease-out-quart active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover rounded-pill shadow-xs hover:shadow-md",
        secondary:
          "bg-transparent text-ink border border-hairline-strong hover:bg-surface hover:border-hairline-strong rounded-pill",
        ghost: "bg-transparent text-ink hover:bg-surface rounded-md",
        accent:
          "bg-accent text-ink hover:brightness-105 rounded-pill shadow-xs hover:shadow-md",
        danger:
          "bg-error text-on-primary hover:brightness-110 rounded-pill shadow-xs hover:shadow-md",
        link: "bg-transparent text-primary-deep hover:text-primary underline-offset-4 hover:underline p-0 h-auto active:scale-100",
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
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
