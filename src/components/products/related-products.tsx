import { getTranslations } from "next-intl/server";

import { productsController } from "@/modules/products";

import { ProductCard } from "./product-card";

/**
 * Server component — pulls related products for a given slug and renders
 * them as a 2/3/4-column compact grid. Hidden when there is nothing to show
 * to avoid empty-state noise.
 */
export async function RelatedProducts({
  slug,
  limit = 6,
}: {
  slug: string;
  limit?: number;
}) {
  const t = await getTranslations("product");
  const items = await productsController.related(slug, limit);
  if (items.length === 0) return null;
  return (
    <section className="space-y-3 pt-4 border-t border-border">
      <h2 className="label-mono text-xs">{t("related.title")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
