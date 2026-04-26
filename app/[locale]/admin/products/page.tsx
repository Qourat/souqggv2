import { Plus } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/products/price";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { productsService } from "@/modules/products";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const r = await productsService.listAllForAdmin(locale);
  const products = r.ok ? r.value : [];

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.nav.products")}
        subtitle={t("admin.products.subtitle")}
        actions={
          <Button
            asChild
            variant="primary"
            size="sm"
            className={!supabaseReady ? "opacity-60 pointer-events-none" : ""}
          >
            <Link href="/admin/products/new">
              <Plus className="h-3 w-3" /> {t("admin.products.new")}
            </Link>
          </Button>
        }
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-start label-mono px-3 h-7">
                {t("admin.products.col.title")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-20">
                {t("admin.products.col.type")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-24">
                {t("admin.products.col.price")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-20">
                {t("admin.products.col.sales")}
              </th>
              <th className="text-end px-2 h-7 w-20" aria-label="" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border last:border-0 row-hover"
              >
                <td className="px-3 py-2 min-w-0">
                  <div className="font-medium text-sm truncate">{p.title}</div>
                  <div className="label-mono">{p.slug}</div>
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{t(`product.type.${p.type}`)}</Badge>
                </td>
                <td className="px-2 py-2 text-end">
                  <Price
                    cents={p.priceCents}
                    compareAtCents={p.compareAtCents}
                    currency={p.currency}
                    discountPct={p.discountPct}
                  />
                </td>
                <td className="px-2 py-2 text-end label-mono tnum">
                  {p.salesCount}
                </td>
                <td className="px-2 py-2 text-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={
                      !supabaseReady ? "opacity-60 pointer-events-none" : ""
                    }
                  >
                    <Link href={`/admin/products/${p.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center label-mono">
                  {t("common.noResults")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
