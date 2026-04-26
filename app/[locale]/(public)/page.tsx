import { setRequestLocale } from "next-intl/server";

import { CategoryStrip } from "@/components/layout/category-strip";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { ProductTable } from "@/components/products/product-table";
import { SortBar } from "@/components/products/sort-bar";
import { StatStrip } from "@/components/products/stat-strip";
import { categoriesController } from "@/modules/categories";
import { productsController } from "@/modules/products";

/**
 * Homepage = the shop. No hero, no banner, no "why buy us" cards above
 * fold. Layout follows F-pattern reading priority:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ STATS — products, categories, satisfaction (one line)    │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ CATEGORY CHIPS (horizontal, scrollable)                  │
 *   ├──────┬───────────────────────────────────────────────────┤
 *   │ FILT │ SORT BAR                                          │
 *   │ ER   ├───────────────────────────────────────────────────┤
 *   │ S    │ DENSE PRODUCT TABLE                               │
 *   │      │ title · type · lang · price · sales · ★ · action │
 *   └──────┴───────────────────────────────────────────────────┘
 */
export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const sort = (typeof sp.sort === "string" ? sp.sort : "best_selling") as
    | "best_selling"
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating";

  const queryInput = {
    sort,
    page: 1,
    perPage: 24,
    categorySlug: typeof sp.category === "string" ? sp.category : undefined,
    type: typeof sp.type === "string" ? sp.type : undefined,
    minPriceCents: sp.minPriceCents
      ? Number(sp.minPriceCents)
      : undefined,
    maxPriceCents: sp.maxPriceCents
      ? Number(sp.maxPriceCents)
      : undefined,
  };

  const [page, categories] = await Promise.all([
    productsController.list(queryInput),
    categoriesController.list(),
  ]);

  const buildSortHref = (s: typeof sort) => {
    const next = new URLSearchParams();
    if (queryInput.categorySlug) next.set("category", queryInput.categorySlug);
    if (queryInput.type) next.set("type", queryInput.type);
    if (typeof queryInput.minPriceCents === "number")
      next.set("minPriceCents", String(queryInput.minPriceCents));
    if (typeof queryInput.maxPriceCents === "number")
      next.set("maxPriceCents", String(queryInput.maxPriceCents));
    next.set("sort", s);
    return `/?${next.toString()}`;
  };

  return (
    <>
      <CategoryStrip activeSlug={queryInput.categorySlug ?? null} />

      <div className="container py-3 space-y-3">
        <StatStrip
          productCount={page.total}
          categoryCount={categories.length}
          satisfaction={4.8}
        />

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          <FilterSidebar
            categories={categories}
            active={{
              category: queryInput.categorySlug,
              type: queryInput.type,
              minPriceCents: queryInput.minPriceCents,
              maxPriceCents: queryInput.maxPriceCents,
            }}
          />

          <div className="space-y-2.5">
            <SortBar active={sort} total={page.total} buildHref={buildSortHref} />
            <ProductTable items={page.items} />
          </div>
        </div>
      </div>
    </>
  );
}
