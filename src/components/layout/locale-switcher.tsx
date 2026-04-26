"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useParams } from "next/navigation";

import { LOCALES } from "@/shared/i18n/locales";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { cn } from "@/shared/utils";

/**
 * Two-or-more locales: when there are ≤3 we render compact pill toggles
 * (Hick's law: fewer choices = faster decision). We auto-switch to a
 * dropdown when the registry grows beyond 3.
 */
export function LocaleSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function go(code: string) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error — next-intl types are tight; runtime is fine
        { pathname, params },
        { locale: code },
      );
    });
  }

  return (
    <div className="inline-flex items-center gap-px border-hairline rounded-sm overflow-hidden">
      {LOCALES.map((l) => {
        const on = l.code === active;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => go(l.code)}
            disabled={pending}
            className={cn(
              "h-7 px-2 font-mono uppercase tracking-wider text-3xs",
              on
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:bg-surface-raised",
            )}
            aria-current={on ? "true" : undefined}
          >
            {l.code}
          </button>
        );
      })}
    </div>
  );
}
