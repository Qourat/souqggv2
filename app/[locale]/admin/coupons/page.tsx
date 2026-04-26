import { Plus } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { couponsController } from "@/modules/coupons";
import { formatPrice } from "@/shared/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const coupons = supabaseReady ? await couponsController.listAll() : [];

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.nav.coupons")}
        subtitle={t("admin.coupons.subtitle")}
        actions={
          <Button
            asChild
            variant="primary"
            size="sm"
            className={!supabaseReady ? "opacity-60 pointer-events-none" : ""}
          >
            <Link href="/admin/coupons/new">
              <Plus className="h-3 w-3" /> {t("admin.coupons.new")}
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
              <th className="text-start label-mono px-3 h-7 w-32">
                {t("admin.coupons.col.code")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.coupons.col.discount")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-28">
                {t("admin.coupons.col.minOrder")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-24">
                {t("admin.coupons.col.usage")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.coupons.col.window")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-20">
                {t("admin.coupons.col.status")}
              </th>
              <th className="text-end px-2 h-7 w-20" aria-label="" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => {
              const discount =
                c.discountType === "percent"
                  ? `${c.discountValue}%`
                  : formatPrice(c.discountValue, "USD", locale);
              return (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 row-hover"
                >
                  <td className="px-3 py-2 font-mono text-sm">{c.code}</td>
                  <td className="px-2 py-2">
                    <Badge
                      variant={
                        c.discountType === "percent" ? "terracotta" : "sage"
                      }
                    >
                      {discount}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-end label-mono tnum">
                    {formatPrice(c.minOrderCents, "USD", locale)}
                  </td>
                  <td className="px-2 py-2 text-end label-mono tnum">
                    {c.usedCount}/{c.usageLimit ?? "∞"}
                  </td>
                  <td className="px-2 py-2 label-mono">
                    {c.startsAt
                      ? new Date(c.startsAt).toLocaleDateString(locale)
                      : "—"}
                    {" → "}
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString(locale)
                      : "∞"}
                  </td>
                  <td className="px-2 py-2">
                    <Badge variant={c.isActive ? "sage" : "ghost"}>
                      {c.isActive
                        ? t("admin.coupons.active")
                        : t("admin.coupons.inactive")}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/coupons/${c.id}/edit`}>
                        {t("common.edit")}
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center label-mono">
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
