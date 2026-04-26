import { Star } from "lucide-react";
import { useLocale } from "next-intl";

import { formatNumber } from "@/shared/utils";

/**
 * Compact rating: ★ N · (count). Social proof anchored to numbers, not bars.
 */
export function Rating({
  value,
  count,
}: {
  value: number;
  count: number;
}) {
  const locale = useLocale();
  if (count === 0) {
    return <span className="label-mono text-muted-foreground">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 tnum">
      <Star className="h-3 w-3 fill-gold text-gold" />
      <span className="text-xs">{value.toFixed(1)}</span>
      <span className="label-mono">({formatNumber(count, locale)})</span>
    </span>
  );
}
