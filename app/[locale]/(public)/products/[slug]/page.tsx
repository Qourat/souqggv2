import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Price } from "@/components/products/price";
import { Rating } from "@/components/products/rating";
import { productsService } from "@/modules/products";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="container py-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <article className="space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline">{t(`product.type.${p.type}`)}</Badge>
              <Badge variant="ghost">{t(`product.license.${p.licenseType}`)}</Badge>
            </div>
            <h1 className="font-mono text-xl tracking-tight">{p.title}</h1>
            {p.descriptionShort ? (
              <p className="text-sm text-muted-foreground mt-1">{p.descriptionShort}</p>
            ) : null}
            <div className="flex items-center gap-3 mt-2">
              <Rating value={p.ratingAvg} count={p.ratingCount} />
              <span className="label-mono">·</span>
              <span className="label-mono">
                {t("product.social.sales", { count: p.salesCount })}
              </span>
            </div>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{t("product.tabs.overview")}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {p.descriptionLong || p.descriptionShort || "—"}
            </p>
          </CardBody>
        </Card>
      </article>

      <aside className="space-y-3">
        <Card>
          <CardBody>
            <div className="flex items-baseline justify-between mb-3">
              <Price
                size="lg"
                cents={p.priceCents}
                compareAtCents={p.compareAtCents}
                currency={p.currency}
                discountPct={p.discountPct}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="primary" size="lg" className="w-full">
                {t("common.buyNow")}
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                {t("common.addToCart")}
              </Button>
            </div>
            <ul className="mt-3 space-y-1 label-mono">
              <li>· {t("product.trust.instant")}</li>
              <li>· {t("product.trust.secure")}</li>
              <li>· {t("product.trust.refund")}</li>
            </ul>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
