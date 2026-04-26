import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { categoriesService } from "@/modules/categories";
import { tField } from "@/shared/i18n/localized-field";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const r = await categoriesService.listAllRaw();
  const categories = (r.ok ? r.value : []).map((c) => ({
    id: c.id,
    name: tField(c.name, locale) ?? c.slug,
  }));

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.products.newTitle")}
        subtitle={t("admin.products.newSubtitle")}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}
      <ProductForm categories={categories} />
    </div>
  );
}
