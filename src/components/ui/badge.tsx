import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-1.5 py-0.5 " +
    "font-mono uppercase tracking-wider text-3xs leading-none " +
    "border-hairline rounded-sm",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        outline: "bg-transparent text-foreground",
        terracotta:
          "bg-terracotta/15 text-terracotta border-terracotta/40",
        sage: "bg-sage/15 text-sage border-sage/40",
        gold: "bg-gold/20 text-gold border-gold/40",
        danger: "bg-danger/15 text-danger border-danger/40",
        ghost: "border-transparent bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
