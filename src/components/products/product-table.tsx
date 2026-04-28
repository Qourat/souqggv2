import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import type { ProductDto } from "@/modules/products";

import { Price } from "./price";
import { Rating } from "./rating";

/**
 * Dense, scannable product table — the primary shop surface.
 *
 * Psychology applied:
 *   - Tabular alignment uses Gestalt 'continuity' so the eye reads down a
 *     column (price column especially) without re-scanning.
 *   - Tabular numerals + hairline rows = Tufte-grade data-ink ratio.
 *   - Hover row inversion gives a clear "you can act here" affordance.
 *   - Type/lang badges are mono-uppercase so they read as metadata, not
 *     content (no semantic confusion with the title).
 */
export function ProductTable({ items }: { items: ProductDto[] }) {
  const t = useTranslations("shop");

  if (items.length === 0) {
    return (
      <div className="border-hairline rounded-sm bg-surface p-6 text-center">
        <p className="font-mono text-sm mb-1">{t("empty.title")}</p>
        <p className="text-xs text-muted-foreground">{t("empty.body")}</p>
      </div>
    );
  }

  return (
    <div className="border-hairline rounded-sm bg-surface overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface-raised">
            <th className="text-start label-mono px-3 py-2 text-xs">{t("table.title")}</th>
            <th className="text-start label-mono px-2 py-2 text-xs w-20 hidden md:table-cell">
              {t("table.type")}
            </th>
            <th className="text-start label-mono px-2 py-2 text-xs w-16 hidden lg:table-cell">
              {t("table.lang")}
            </th>
            <th className="text-end label-mono px-2 py-2 text-xs w-24">{t("table.price")}</th>
            <th className="text-end label-mono px-2 py-2 text-xs w-20 hidden md:table-cell">
              {t("table.sales")}
            </th>
            <th className="text-end label-mono px-2 py-2 text-xs w-28 hidden md:table-cell">
              {t("table.rating")}
            </th>
            <th className="px-2 py-2 w-24 text-xs" aria-label={t("table.action")} />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({ product: p }: { product: ProductDto }) {
  const t = useTranslations();
  return (
    <tr className="border-b border-border last:border-0 row-hover">
      <td className="px-3 py-2.5">
        <Link
          href={`/products/${p.slug}`}
          className="block group"
        >
          <div className="font-medium text-sm leading-snug group-hover:text-terracotta transition-colors duration-150">
            {p.title}
          </div>
          {p.descriptionShort ? (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {p.descriptionShort}
            </div>
          ) : null}
        </Link>
      </td>
      <td className="px-2 py-2.5 hidden md:table-cell">
        <Badge variant="outline" className="transition-opacity duration-150 hover:opacity-80">{t(`product.type.${p.type}`)}</Badge>
      </td>
      <td className="px-2 py-2.5 hidden lg:table-cell">
        <span className="label-mono text-xs">
          {p.contentLanguages.length > 0
            ? p.contentLanguages.map((c) => c.toUpperCase()).join(" · ")
            : "—"}
        </span>
      </td>
      <td className="px-2 py-2.5 text-end">
        <Price
          cents={p.priceCents}
          compareAtCents={p.compareAtCents}
          currency={p.currency}
          discountPct={p.discountPct}
        />
      </td>
      <td className="px-2 py-2.5 text-end hidden md:table-cell">
        <span className="label-mono tnum text-xs">{p.salesCount}</span>
      </td>
      <td className="px-2 py-2.5 text-end hidden md:table-cell">
        <Rating value={p.ratingAvg} count={p.ratingCount} />
      </td>
      <td className="px-2 py-2.5 text-end">
        <Button asChild variant="outline" size="sm" className="transition-all duration-150">
          <Link href={`/products/${p.slug}`}>{t("common.buyNow")}</Link>
        </Button>
      </td>
    </tr>
  );
}
