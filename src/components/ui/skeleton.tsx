import * as React from "react";

import { cn } from "@/shared/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse-subtle bg-muted rounded-sm",
        className,
      )}
      {...props}
    />
  );
}
