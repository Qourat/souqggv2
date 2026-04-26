import { useTranslations } from "next-intl";

/**
 * One-line stat strip — replaces the hero. Three numbers establish trust
 * (social proof + data-density signal) without consuming above-fold real
 * estate. Stat ordering uses the serial-position effect: the most
 * persuasive number (satisfaction rating) goes last so it sticks.
 */
export function StatStrip({
  productCount,
  categoryCount,
  satisfaction,
}: {
  productCount: number;
  categoryCount: number;
  satisfaction: number;
}) {
  const t = useTranslations();
  return (
    <div className="border-hairline rounded-sm bg-surface px-3 py-2 flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
      <div className="flex items-center gap-1 label-mono">
        <span className="text-foreground tnum">{productCount}</span>
        <span>{t("shop.stat.products", { count: productCount })}</span>
      </div>
      <div className="hidden sm:flex items-center gap-1 label-mono">
        <span className="text-foreground tnum">{categoryCount}</span>
        <span>{t("shop.stat.categories", { count: categoryCount })}</span>
      </div>
      <div className="flex items-center gap-1 label-mono">
        <span className="text-foreground tnum">{satisfaction.toFixed(1)}/5</span>
        <span>{t("shop.stat.satisfaction", { rating: satisfaction.toFixed(1) })}</span>
      </div>
    </div>
  );
}
