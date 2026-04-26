import { setRequestLocale } from "next-intl/server";

import { CategoryStrip } from "@/components/layout/category-strip";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { ProductTable } from "@/components/products/product-table";
import { SortBar } from "@/components/products/sort-bar";
import { StatStrip } from "@/components/products/stat-strip";
import { categoriesController } from "@/modules/categories";
import { productsController } from "@/modules/products";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
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
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const minPriceCents = sp.minPriceCents ? Number(sp.minPriceCents) : undefined;
  const maxPriceCents = sp.maxPriceCents ? Number(sp.maxPriceCents) : undefined;

  const [page, categories] = await Promise.all([
    productsController.list({
      q,
      sort,
      page: 1,
      perPage: 36,
      categorySlug,
      type,
      minPriceCents,
      maxPriceCents,
    }),
    categoriesController.list(),
  ]);

  const buildSortHref = (s: typeof sort) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (categorySlug) next.set("category", categorySlug);
    if (type) next.set("type", type);
    if (typeof minPriceCents === "number") next.set("minPriceCents", String(minPriceCents));
    if (typeof maxPriceCents === "number") next.set("maxPriceCents", String(maxPriceCents));
    next.set("sort", s);
    return `/products?${next.toString()}`;
  };

  return (
    <>
      <CategoryStrip activeSlug={categorySlug ?? null} />

      <div className="container py-3 space-y-3">
        <StatStrip
          productCount={page.total}
          categoryCount={categories.length}
          satisfaction={4.8}
        />

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          <FilterSidebar
            categories={categories}
            active={{ category: categorySlug, type, minPriceCents, maxPriceCents }}
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
