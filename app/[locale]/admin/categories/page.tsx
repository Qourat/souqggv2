import { Plus } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { categoriesController } from "@/modules/categories";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const categories = await categoriesController.list();
  const supabaseReady = hasSupabase();

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.nav.categories")}
        subtitle={t("admin.categories.subtitle")}
        actions={
          <Button
            asChild
            variant="primary"
            size="sm"
            disabled={!supabaseReady}
            className={!supabaseReady ? "opacity-60 pointer-events-none" : ""}
          >
            <Link href="/admin/categories/new">
              <Plus className="h-3 w-3" /> {t("admin.categories.new")}
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
                {t("admin.categories.col.name")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-40">
                {t("admin.categories.col.slug")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-16">
                {t("admin.categories.col.sort")}
              </th>
              <th className="text-end px-2 h-7 w-32" aria-label="" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 row-hover"
              >
                <td className="px-3 py-2">
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.description ? (
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {c.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{c.slug}</Badge>
                </td>
                <td className="px-2 py-2 text-end label-mono tnum">
                  {c.sortOrder}
                </td>
                <td className="px-2 py-2 text-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={!supabaseReady}
                    className={
                      !supabaseReady ? "opacity-60 pointer-events-none" : ""
                    }
                  >
                    <Link href={`/admin/categories/${c.id}/edit`}>
                      {t("common.edit")}
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center label-mono">
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
