import { useTranslations } from "next-intl";

import { Link } from "@/shared/i18n/navigation";
import { cn } from "@/shared/utils";

const SORTS = ["best_selling", "newest", "price_asc", "price_desc", "rating"] as const;
type Sort = (typeof SORTS)[number];

/**
 * Sort row above the product table. The DEFAULT (best_selling) is always
 * leftmost — psychology: default-effect bias means most users won't change
 * it, and "best selling" is a strong social-proof anchor.
 */
export function SortBar({
  active,
  total,
  buildHref,
}: {
  active: Sort;
  total: number;
  buildHref: (sort: Sort) => string;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-between border-hairline rounded-sm bg-surface px-3 h-9">
      <div className="label-mono text-xs">
        {total} {t("nav.shop")}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="label-mono text-xs mr-0.5">{t("shop.sort.label")}:</span>
        {SORTS.map((s) => (
          <Link
            key={s}
            href={buildHref(s)}
            className={cn(
              "px-2 h-6 inline-flex items-center label-mono text-xs rounded-sm transition-colors duration-150",
              s === active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
            )}
          >
            {t(`shop.sort.${camel(s)}`)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function camel(s: string) {
  return s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase()) as
    | "bestSelling"
    | "newest"
    | "priceAsc"
    | "priceDesc"
    | "rating";
}
