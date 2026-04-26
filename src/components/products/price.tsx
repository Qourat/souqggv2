import { useLocale } from "next-intl";

import { formatPrice } from "@/shared/utils";

/**
 * Price + compare-at strikethrough + discount %.
 *
 * Psychology: Anchoring (compare-at on the left primes a higher reference,
 * making the actual price feel like a deal) + Loss aversion (showing the
 * % off frames inaction as losing the deal).
 */
export function Price({
  cents,
  compareAtCents,
  currency,
  discountPct,
  size = "md",
}: {
  cents: number;
  compareAtCents?: number | null;
  currency: string;
  discountPct?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const locale = useLocale();
  const sizeCls =
    size === "lg" ? "text-md" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className="inline-flex items-baseline gap-1.5 tnum">
      {compareAtCents && compareAtCents > cents ? (
        <span className="text-muted-foreground line-through text-2xs">
          {formatPrice(compareAtCents, currency, locale)}
        </span>
      ) : null}
      <span className={`font-mono ${sizeCls} text-foreground`}>
        {cents === 0 ? "FREE" : formatPrice(cents, currency, locale)}
      </span>
      {typeof discountPct === "number" && discountPct > 0 ? (
        <span className="label-mono text-terracotta">−{discountPct}%</span>
      ) : null}
    </span>
  );
}
