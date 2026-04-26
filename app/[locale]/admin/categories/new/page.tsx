import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.categories.new")}
        subtitle={t("admin.categories.newSubtitle")}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : (
        <CategoryForm />
      )}
    </div>
  );
}
