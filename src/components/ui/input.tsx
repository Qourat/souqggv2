import * as React from "react";

import { cn } from "@/shared/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-8 w-full bg-input text-foreground border-hairline rounded-sm",
        "px-2.5 text-sm placeholder:text-muted-foreground",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
