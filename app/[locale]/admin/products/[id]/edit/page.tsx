import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { categoriesService } from "@/modules/categories";
import { productsService } from "@/modules/products";
import { tField } from "@/shared/i18n/localized-field";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const productResult = await productsService.getByIdRaw(id);
  if (!productResult.ok || !productResult.value) {
    notFound();
  }
  const p = productResult.value;

  const catRes = await categoriesService.listAllRaw();
  const categories = (catRes.ok ? catRes.value : []).map((c) => ({
    id: c.id,
    name: tField(c.name, locale) ?? c.slug,
  }));

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.products.editTitle")}
        subtitle={p.slug}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}
      <ProductForm
        categories={categories}
        defaultValues={{
          id: p.id,
          slug: p.slug,
          type: p.type,
          status: p.status,
          categoryId: p.categoryId ?? "",
          priceCents: p.priceCents,
          compareAtCents: p.compareAtCents ?? null,
          currency: p.currency,
          licenseType: p.licenseType,
          downloadLimit: p.downloadLimit,
          thumbnailUrl: p.thumbnailUrl ?? "",
          isFeatured: p.isFeatured,
          contentLanguages: p.contentLanguages ?? [],
          title: (p.title ?? {}) as Record<string, string>,
          descriptionShort: (p.descriptionShort ?? {}) as Record<string, string>,
          descriptionLong: (p.descriptionLong ?? {}) as Record<string, string>,
        }}
      />
    </div>
  );
}
