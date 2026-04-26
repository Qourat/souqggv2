import { AlertTriangle } from "lucide-react";

/**
 * Slim warning banner shown across admin screens when something is not
 * configured (e.g. Supabase missing). Keeps the same retro language as
 * the rest of the system — single line, terracotta accent, no modal.
 */
export function AdminBanner({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="border-hairline border-terracotta/50 bg-terracotta/10 rounded-sm p-3 flex items-start gap-2">
      <AlertTriangle className="h-3.5 w-3.5 text-terracotta mt-0.5 shrink-0" />
      <div className="space-y-0.5 min-w-0">
        <div className="font-mono text-xs text-terracotta">{title}</div>
        {body ? (
          <p className="text-xs text-muted-foreground">{body}</p>
        ) : null}
      </div>
    </div>
  );
}
