import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { ordersController, type OrderDto } from "@/modules/orders";
import { formatPrice } from "@/shared/utils";

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!hasSupabase()) {
    return (
      <div className="container py-3 space-y-3">
        <AdminPageHeader title={t("admin.orders.detail.title")} />
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      </div>
    );
  }

  const order = await ordersController.getById(id);
  if (!order) notFound();

  return (
    <div className="container py-3 space-y-3">
      <div className="text-xs">
        <Link
          href="/admin/orders"
          className="label-mono hover:text-terracotta"
        >
          ← {t("admin.nav.orders")}
        </Link>
      </div>

      <AdminPageHeader
        title={
          <span className="font-mono">
            order · <span className="text-terracotta">{order.id.slice(0, 8)}</span>
          </span>
        }
        subtitle={
          order.email ?? t("admin.orders.detail.guest")
        }
      />

      <div className="grid lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2 border-hairline rounded-sm bg-surface overflow-hidden">
          <header className="px-3 h-7 flex items-center border-b border-border bg-surface-raised">
            <span className="label-mono">
              {t("admin.orders.detail.items")}
            </span>
          </header>
          <table className="w-full">
            <tbody>
              {order.items.map((it) => (
                <tr
                  key={it.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {it.title}
                    </div>
                    <div className="label-mono">
                      {t("admin.orders.detail.unitPrice")}{" "}
                      {formatPrice(it.unitPriceCents, order.currency, locale)}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-end label-mono tnum w-12">
                    ×{it.quantity}
                  </td>
                  <td className="px-2 py-2 text-end tnum text-sm w-28">
                    {formatPrice(it.lineTotalCents, order.currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border-hairline rounded-sm bg-surface">
          <header className="px-3 h-7 flex items-center border-b border-border bg-surface-raised">
            <span className="label-mono">
              {t("admin.orders.detail.summary")}
            </span>
          </header>
          <dl className="text-xs divide-y divide-border">
            <div className="flex items-center justify-between px-3 py-1.5">
              <dt className="label-mono">{t("admin.orders.detail.status")}</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[order.status]}>
                  {t(`order.status.${order.status}`)}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <dt className="label-mono">
                {t("admin.orders.detail.subtotal")}
              </dt>
              <dd className="tnum">
                {formatPrice(order.subtotalCents, order.currency, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <dt className="label-mono">
                {t("admin.orders.detail.discount")}
              </dt>
              <dd className="tnum">
                {formatPrice(order.discountCents, order.currency, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-raised">
              <dt className="label-mono font-bold">
                {t("admin.orders.detail.total")}
              </dt>
              <dd className="tnum font-mono text-base">
                {formatPrice(order.totalCents, order.currency, locale)}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5">
              <dt className="label-mono">
                {t("admin.orders.detail.created")}
              </dt>
              <dd className="label-mono">
                {new Date(order.createdAt).toLocaleString(locale, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            {order.paidAt ? (
              <div className="flex items-center justify-between px-3 py-1.5">
                <dt className="label-mono">
                  {t("admin.orders.detail.paidAt")}
                </dt>
                <dd className="label-mono">
                  {new Date(order.paidAt).toLocaleString(locale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>
    </div>
  );
}
