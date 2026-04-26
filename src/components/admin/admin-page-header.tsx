import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 pb-2 border-b border-border">
      <div>
        <h1 className="font-mono text-lg">{title}</h1>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </header>
  );
}
