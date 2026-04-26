import { setRequestLocale, getTranslations } from "next-intl/server";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/shared/i18n/navigation";
import { categoriesController } from "@/modules/categories";

/**
 * Categories index — terse list of every category as a clickable card.
 * Each card navigates to /categories/<slug>, which is the same compact
 * shop view filtered to that category.
 */
export default async function CategoriesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const categories = await categoriesController.list();

  return (
    <div className="container py-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="font-mono text-xl">{t("nav.categories")}</h1>
        <span className="label-mono">{categories.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="group"
          >
            <Card className="row-hover">
              <CardHeader>
                <CardTitle className="group-hover:text-terracotta">
                  {c.name}
                </CardTitle>
                <span className="label-mono">{c.slug}</span>
              </CardHeader>
              {c.description ? (
                <CardBody>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                </CardBody>
              ) : null}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
