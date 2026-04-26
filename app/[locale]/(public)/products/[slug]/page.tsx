import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BuyBar } from "@/components/products/buy-bar";
import { Price } from "@/components/products/price";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductTabs, type ProductTab } from "@/components/products/product-tabs";
import { Rating } from "@/components/products/rating";
import { RelatedProducts } from "@/components/products/related-products";
import { productsController, productsService } from "@/modules/products";
import { Link } from "@/shared/i18n/navigation";
import { publicEnv } from "@/shared/env";

/**
 * Product detail = the most important sales surface in the store.
 *
 * Layout (desktop):
 *
 *   ┌────────────────────────────────────────┬──────────────┐
 *   │ Breadcrumb · type · license            │  STICKY      │
 *   │ Title · short desc · rating · sold     │  PURCHASE    │
 *   │ Gallery (placeholder if no images)     │  CARD        │
 *   │ Tabs: overview / inside / who / how    │  Specs       │
 *   │       / faq                            │  list        │
 *   └────────────────────────────────────────┴──────────────┘
 *   Related products grid
 *
 * Psychology applied:
 *   - Anchoring: compare-at price + discount % shown next to CTA.
 *   - Loss aversion: "Refund 30 days · Instant download" beneath CTA.
 *   - Social proof: rating + sold count next to title.
 *   - Default effect: Overview tab pre-selected.
 *   - Authority: License, downloadLimit, language listed in Specs to
 *     reassure rights-conscious buyers.
 */

export async function generateStaticParams() {
  const slugs = await productsController.allSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = await productsService.getBySlug(slug, locale);
  if (!r.ok) return { title: "Not found" };
  const p = r.value;
  const url = `${publicEnv.appUrl}/${locale}/products/${slug}`;
  return {
    title: p.title,
    description: p.descriptionShort || p.descriptionLong.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description: p.descriptionShort || p.descriptionLong.slice(0, 160),
      url,
      type: "website",
      images: p.thumbnailUrl ? [{ url: p.thumbnailUrl }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const r = await productsService.getBySlug(slug, locale);
  if (!r.ok) notFound();
  const p = r.value;
  const t = await getTranslations();

  const tabs: ProductTab[] = [
    {
      key: "overview",
      content: (
        <p className="whitespace-pre-line text-foreground/90">
          {p.descriptionLong || p.descriptionShort}
        </p>
      ),
    },
    {
      key: "included",
      content:
        p.bullets.length > 0 ? (
          <ul className="space-y-1.5">
            {p.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="label-mono mt-0.5">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null,
    },
    { key: "audience", content: <p>{t("product.audience.empty")}</p> },
    { key: "howto", content: <p>{t("product.howto.empty")}</p> },
    { key: "faq", content: <p>{t("product.faq.empty")}</p> },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.descriptionShort || p.descriptionLong.slice(0, 200),
    sku: p.id,
    brand: { "@type": "Brand", name: "souq" },
    aggregateRating:
      p.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: p.ratingAvg,
            reviewCount: p.ratingCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${publicEnv.appUrl}/${locale}/products/${p.slug}`,
      priceCurrency: p.currency,
      price: (p.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  const publishedDate = p.publishedAt
    ? new Date(p.publishedAt).toLocaleDateString(locale)
    : null;

  return (
    <div className="container py-3 space-y-4">
      <Breadcrumb title={p.title} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <article className="space-y-3 min-w-0">
          <header className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline">{t(`product.type.${p.type}`)}</Badge>
              <Badge variant="ghost">{t(`product.license.${p.licenseType}`)}</Badge>
              {p.contentLanguages.length > 0 ? (
                <Badge variant="ghost">
                  {p.contentLanguages.map((c) => c.toUpperCase()).join(" · ")}
                </Badge>
              ) : null}
            </div>
            <h1 className="font-mono text-xl tracking-tight">{p.title}</h1>
            {p.descriptionShort ? (
              <p className="text-sm text-muted-foreground">
                {p.descriptionShort}
              </p>
            ) : null}
            <div className="flex items-center gap-3 pt-0.5">
              <Rating value={p.ratingAvg} count={p.ratingCount} />
              <span className="label-mono">·</span>
              <span className="label-mono">
                {t("product.social.sales", { count: p.salesCount })}
              </span>
              {publishedDate ? (
                <>
                  <span className="label-mono">·</span>
                  <span className="label-mono">{publishedDate}</span>
                </>
              ) : null}
            </div>
          </header>

          <ProductGallery
            thumbnailUrl={p.thumbnailUrl}
            galleryUrls={p.galleryUrls}
            title={p.title}
            type={t(`product.type.${p.type}`)}
          />

          <ProductTabs tabs={tabs} />
        </article>

        <aside className="space-y-3 lg:sticky lg:top-12 self-start">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-baseline justify-between">
                <Price
                  size="lg"
                  cents={p.priceCents}
                  compareAtCents={p.compareAtCents}
                  currency={p.currency}
                  discountPct={p.discountPct}
                />
              </div>

              <BuyBar product={p} />

              <ul className="space-y-1 label-mono">
                <li>· {t("product.trust.instant")}</li>
                <li>· {t("product.trust.secure")}</li>
                <li>· {t("product.trust.refund")}</li>
                <li>· {t("product.trust.updated")}</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="label-mono mb-2">{t("product.specs.title")}</div>
              <SpecRow
                label={t("product.specs.license")}
                value={t(`product.license.${p.licenseType}`)}
              />
              <Separator />
              <SpecRow
                label={t("product.specs.format")}
                value={t(`product.type.${p.type}`)}
              />
              <Separator />
              <SpecRow
                label={t("product.specs.languages")}
                value={
                  p.contentLanguages.length > 0
                    ? p.contentLanguages.map((c) => c.toUpperCase()).join(", ")
                    : "—"
                }
              />
              <Separator />
              <SpecRow
                label={t("product.specs.downloadLimit")}
                value={t("product.specs.uses", { count: p.downloadLimit })}
              />
              {publishedDate ? (
                <>
                  <Separator />
                  <SpecRow
                    label={t("product.specs.published")}
                    value={publishedDate}
                  />
                </>
              ) : null}
            </CardBody>
          </Card>
        </aside>
      </div>

      <RelatedProducts slug={p.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="label-mono">{label}</span>
      <span className="text-xs tnum text-foreground">{value}</span>
    </div>
  );
}

async function Breadcrumb({ title }: { title: string }) {
  const t = await getTranslations("breadcrumb");
  return (
    <nav
      aria-label="breadcrumb"
      className="label-mono flex items-center gap-1.5 truncate"
    >
      <Link href="/" className="hover:text-foreground">
        {t("shop")}
      </Link>
      <span aria-hidden>/</span>
      <span className="truncate text-foreground">{title}</span>
    </nav>
  );
}
