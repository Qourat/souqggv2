import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { CategoryStrip } from "@/components/layout/category-strip";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { ProductTable } from "@/components/products/product-table";
import { SortBar } from "@/components/products/sort-bar";
import { categoriesController, categoriesService } from "@/modules/categories";
import { productsController } from "@/modules/products";
import { Link } from "@/shared/i18n/navigation";
import { publicEnv } from "@/shared/env";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = await categoriesService.getBySlug(slug, locale);
  if (!r.ok) return { title: "Not found" };
  const c = r.value;
  return {
    title: c.name,
    description: c.description,
    alternates: { canonical: `${publicEnv.appUrl}/${locale}/categories/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const r = await categoriesService.getBySlug(slug, locale);
  if (!r.ok) notFound();
  const category = r.value;

  const sp = await searchParams;
  const sort = (typeof sp.sort === "string" ? sp.sort : "best_selling") as
    | "best_selling"
    | "newest"
    | "price_asc"
    | "price_desc"
    | "rating";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;
  const minPriceCents = sp.minPriceCents ? Number(sp.minPriceCents) : undefined;
  const maxPriceCents = sp.maxPriceCents ? Number(sp.maxPriceCents) : undefined;

  const [page, categories] = await Promise.all([
    productsController.list({
      q,
      sort,
      page: 1,
      perPage: 36,
      categorySlug: slug,
      type,
      minPriceCents,
      maxPriceCents,
    }),
    categoriesController.list(),
  ]);

  const t = await getTranslations();

  const buildSortHref = (s: typeof sort) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type) next.set("type", type);
    if (typeof minPriceCents === "number")
      next.set("minPriceCents", String(minPriceCents));
    if (typeof maxPriceCents === "number")
      next.set("maxPriceCents", String(maxPriceCents));
    next.set("sort", s);
    return `/categories/${slug}?${next.toString()}`;
  };

  return (
    <>
      <CategoryStrip activeSlug={slug} />

      <div className="container py-3 space-y-3">
        <nav
          aria-label="breadcrumb"
          className="label-mono flex items-center gap-1.5 truncate"
        >
          <Link href="/" className="hover:text-foreground">
            {t("breadcrumb.shop")}
          </Link>
          <span aria-hidden>/</span>
          <Link href="/categories" className="hover:text-foreground">
            {t("breadcrumb.categories")}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-foreground">{category.name}</span>
        </nav>

        <header className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="font-mono text-xl">{category.name}</h1>
            {category.description ? (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            ) : null}
          </div>
          <span className="label-mono whitespace-nowrap">
            {t("shop.stat.products", { count: page.total })}
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          <FilterSidebar
            categories={categories}
            active={{ category: slug, type, minPriceCents, maxPriceCents }}
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
