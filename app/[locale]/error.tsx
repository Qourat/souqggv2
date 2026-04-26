"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center max-w-sm space-y-3">
        <p className="font-mono text-3xl">500</p>
        <h1 className="font-mono text-md">Something went wrong</h1>
        <p className="text-xs text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
