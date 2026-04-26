import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { categoriesService } from "@/modules/categories";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  if (!supabaseReady) {
    return (
      <div className="container py-3 space-y-3">
        <AdminPageHeader title={t("admin.categories.edit")} />
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      </div>
    );
  }

  const r = await categoriesService.getByIdRaw(id);
  if (!r.ok || !r.value) notFound();
  const c = r.value;

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.categories.edit")}
        subtitle={c.slug}
      />
      <CategoryForm
        defaultValues={{
          id: c.id,
          slug: c.slug,
          name: (c.name ?? {}) as Record<string, string>,
          description: (c.description ?? {}) as Record<string, string>,
          icon: c.icon ?? null,
          sortOrder: c.sortOrder,
        }}
      />
    </div>
  );
}
