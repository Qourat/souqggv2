import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

/**
 * Sizes follow Fitts's Law: primary CTAs are larger and easier to hit.
 *   sm  28px — secondary, in-table actions
 *   md  32px — default, used everywhere
 *   lg  36px — primary CTAs (buy now, checkout)
 *   icon 28px square
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap " +
    "font-mono uppercase tracking-wider text-2xs " +
    "border-hairline rounded-sm transition-colors duration-75 " +
    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background border-foreground hover:bg-foreground/90",
        primary:
          "bg-terracotta text-terracotta-foreground border-terracotta hover:brightness-110",
        outline:
          "bg-transparent text-foreground hover:bg-surface-raised",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-surface-raised",
        muted:
          "bg-muted text-foreground hover:bg-muted/80",
        danger:
          "bg-danger text-danger-foreground border-danger hover:brightness-110",
        link:
          "border-transparent text-foreground hover:underline underline-offset-2 normal-case",
      },
      size: {
        sm: "h-7 px-2.5",
        md: "h-8 px-3",
        lg: "h-9 px-4 text-xs",
        icon: "h-7 w-7 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
