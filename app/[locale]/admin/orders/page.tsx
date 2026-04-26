import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { ordersController } from "@/modules/orders";
import { formatPrice } from "@/shared/utils";

import type { OrderDto } from "@/modules/orders";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  OrderDto["status"],
  "gold" | "sage" | "terracotta" | "danger" | "outline" | "ghost"
> = {
  pending: "gold",
  paid: "sage",
  fulfilled: "terracotta",
  failed: "danger",
  refunded: "outline",
  cancelled: "ghost",
};

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { status, page } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const allowedStatus = new Set<OrderDto["status"]>([
    "pending",
    "paid",
    "fulfilled",
    "failed",
    "refunded",
    "cancelled",
  ]);
  const activeStatus = allowedStatus.has(status as OrderDto["status"])
    ? (status as OrderDto["status"])
    : undefined;
  const pageNum = Math.max(1, Number(page ?? 1) || 1);
  const pageSize = 25;

  const { rows, total } = supabaseReady
    ? await ordersController.listAllForAdmin({
        status: activeStatus,
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
      })
    : { rows: [] as OrderDto[], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const statusFilters: Array<OrderDto["status"] | "all"> = [
    "all",
    "pending",
    "paid",
    "failed",
    "refunded",
  ];

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.nav.orders")}
        subtitle={t("admin.orders.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      <div className="flex items-center gap-2 text-xs">
        {statusFilters.map((s) => {
          const href =
            s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`;
          const active =
            (s === "all" && !activeStatus) || s === activeStatus;
          return (
            <Link
              key={s}
              href={href}
              className={`label-mono px-2 h-6 inline-flex items-center border-hairline rounded-sm ${
                active
                  ? "bg-terracotta text-terracotta-foreground border-terracotta"
                  : "hover:bg-surface-raised"
              }`}
            >
              {t(`admin.orders.filter.${s}`)}
            </Link>
          );
        })}
        <span className="ml-auto label-mono">
          {t("admin.orders.totalCount", { count: total })}
        </span>
        <Button asChild variant="outline" size="sm" title={t("admin.orders.exportHint")}>
          <a
            href={`/api/admin/orders/export${activeStatus ? `?status=${activeStatus}` : ""}`}
          >
            {t("admin.orders.exportCsv")}
          </a>
        </Button>
      </div>

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-start label-mono px-3 h-7 w-32">
                {t("admin.orders.col.id")}
              </th>
              <th className="text-start label-mono px-2 h-7">
                {t("admin.orders.col.email")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-24">
                {t("admin.orders.col.status")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-16">
                {t("admin.orders.col.items")}
              </th>
              <th className="text-end label-mono px-2 h-7 w-24">
                {t("admin.orders.col.total")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.orders.col.created")}
              </th>
              <th className="text-end px-2 h-7 w-16" aria-label="" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className="border-b border-border last:border-0 row-hover"
              >
                <td className="px-3 py-2 font-mono text-xs">
                  {o.id.slice(0, 8)}…
                </td>
                <td className="px-2 py-2 text-sm truncate">
                  {o.email ?? "—"}
                </td>
                <td className="px-2 py-2">
                  <Badge variant={STATUS_VARIANT[o.status]}>
                    {t(`order.status.${o.status}`)}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-end label-mono tnum">
                  {o.items.length}
                </td>
                <td className="px-2 py-2 text-end tnum text-sm">
                  {formatPrice(o.totalCents, o.currency, locale)}
                </td>
                <td className="px-2 py-2 label-mono">
                  {new Date(o.createdAt).toLocaleString(locale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-2 py-2 text-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders/${o.id}`}>
                      {t("common.view")}
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center label-mono">
                  {t("common.noResults")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="label-mono">
            {t("admin.orders.page", { page: pageNum, total: totalPages })}
          </span>
          <div className="flex gap-1">
            {pageNum > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/orders?${new URLSearchParams({
                    ...(activeStatus ? { status: activeStatus } : {}),
                    page: String(pageNum - 1),
                  }).toString()}`}
                >
                  {t("common.prev")}
                </Link>
              </Button>
            ) : null}
            {pageNum < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/orders?${new URLSearchParams({
                    ...(activeStatus ? { status: activeStatus } : {}),
                    page: String(pageNum + 1),
                  }).toString()}`}
                >
                  {t("common.next")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
