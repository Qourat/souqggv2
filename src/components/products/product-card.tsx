import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/shared/i18n/navigation";
import type { ProductDto } from "@/modules/products";

import { Price } from "./price";
import { Rating } from "./rating";

/**
 * Compact card used in carousels and the related-products strip.
 *
 * Stays tight — no large hero, no "feature" art. Same tabular hierarchy as
 * the product table: title → metadata badges → price → rating.
 */
export function ProductCard({ product: p }: { product: ProductDto }) {
  const t = useTranslations();
  return (
    <Link
      href={`/products/${p.slug}`}
      className="group block border-hairline rounded-sm bg-surface row-hover p-3"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <Badge variant="outline">{t(`product.type.${p.type}`)}</Badge>
        {p.isOnSale && p.discountPct ? (
          <Badge variant="terracotta">−{p.discountPct}%</Badge>
        ) : null}
      </div>
      <div className="font-medium text-sm leading-tight group-hover:text-terracotta line-clamp-2 min-h-[2.4rem]">
        {p.title}
      </div>
      {p.descriptionShort ? (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.1rem]">
          {p.descriptionShort}
        </p>
      ) : null}
      <div className="flex items-center justify-between mt-2.5">
        <Price
          cents={p.priceCents}
          compareAtCents={p.compareAtCents}
          currency={p.currency}
          discountPct={p.discountPct}
        />
        <Rating value={p.ratingAvg} count={p.ratingCount} />
      </div>
    </Link>
  );
}
