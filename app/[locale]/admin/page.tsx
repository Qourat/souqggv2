import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  Banknote,
  Boxes,
  Clock,
  PackageX,
  ShoppingCart,
  Sparkles,
  Star,
  TriangleAlert,
} from "lucide-react";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabase } from "@/shared/db/has-supabase";
import { Link } from "@/shared/i18n/navigation";
import { formatPrice } from "@/shared/utils";
import { analyticsController } from "@/modules/analytics";

import type { DashboardRecentOrder } from "@/modules/analytics";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<
  DashboardRecentOrder["status"],
  "gold" | "sage" | "terracotta" | "danger" | "outline" | "ghost"
> = {
  pending: "gold",
  paid: "sage",
  fulfilled: "terracotta",
  failed: "danger",
  refunded: "outline",
  cancelled: "ghost",
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const summary = await analyticsController.dashboardSummary();

  const cards: Array<{
    key: string;
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    href?: string;
    intent?: "default" | "success" | "warning" | "danger";
  }> = [
    {
      key: "revenueMtd",
      label: t("admin.stat.revenueMtd"),
      value: formatPrice(
        summary.revenueMtdCents,
        summary.revenueMtdCurrency,
        locale,
      ),
      sub: t("admin.dashboard.thisMonth"),
      icon: Banknote,
      href: "/admin/orders?status=paid",
      intent: "success",
    },
    {
      key: "ordersMtd",
      label: t("admin.stat.orders"),
      value: String(summary.ordersMtd),
      sub: t("admin.dashboard.thisMonth"),
      icon: ShoppingCart,
      href: "/admin/orders?status=paid",
    },
    {
      key: "pending",
      label: t("admin.dashboard.pending"),
      value: String(summary.pendingOrders),
      sub: t("admin.dashboard.openCheckouts"),
      icon: Clock,
      href: "/admin/orders?status=pending",
      intent: summary.pendingOrders > 0 ? "warning" : "default",
    },
    {
      key: "failed",
      label: t("admin.stat.failedPayments"),
      value: String(summary.failedMtd),
      sub: t("admin.dashboard.thisMonth"),
      icon: TriangleAlert,
      href: "/admin/orders?status=failed",
      intent: summary.failedMtd > 0 ? "danger" : "default",
    },
    {
      key: "products",
      label: t("admin.stat.products"),
      value: String(summary.publishedProducts),
      sub: t("admin.dashboard.published"),
      icon: Boxes,
      href: "/admin/products",
    },
    {
      key: "drafts",
      label: t("admin.stat.draftProducts"),
      value: String(summary.draftProducts),
      sub: t("admin.dashboard.notLive"),
      icon: PackageX,
      href: "/admin/products",
    },
  ];

  const intentClass = {
    success: "text-sage",
    warning: "text-gold",
    danger: "text-terracotta",
    default: "text-foreground",
  } as const;

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.dashboard.title")}
        subtitle={t("admin.dashboard.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <Card className="h-full hover:bg-surface-raised transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  <span>{c.label}</span>
                </CardTitle>
                {c.href ? (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                ) : null}
              </CardHeader>
              <CardBody className="space-y-0.5">
                <span
                  className={`font-mono text-lg tnum ${intentClass[c.intent ?? "default"]}`}
                >
                  {c.value}
                </span>
                {c.sub ? (
                  <div className="label-mono text-muted-foreground">
                    {c.sub}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          );
          return c.href ? (
            <Link key={c.key} href={c.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={c.key}>{inner}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <ShoppingCart className="h-3 w-3" />
              {t("admin.dashboard.recentOrders")}
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">{t("common.view")}</Link>
            </Button>
          </CardHeader>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-start label-mono px-3 h-7 w-28">
                    {t("admin.orders.col.id")}
                  </th>
                  <th className="text-start label-mono px-2 h-7">
                    {t("admin.orders.col.email")}
                  </th>
                  <th className="text-start label-mono px-2 h-7 w-24">
                    {t("admin.orders.col.status")}
                  </th>
                  <th className="text-end label-mono px-2 h-7 w-24">
                    {t("admin.orders.col.total")}
                  </th>
                  <th className="text-start label-mono px-2 h-7 w-28">
                    {t("admin.orders.col.created")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 row-hover"
                  >
                    <td className="px-3 py-1.5 font-mono text-xs">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="hover:text-terracotta"
                      >
                        {o.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-sm truncate">
                      {o.email ?? "—"}
                    </td>
                    <td className="px-2 py-1.5">
                      <Badge variant={STATUS_VARIANT[o.status]}>
                        {t(`order.status.${o.status}`)}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5 text-end tnum text-sm">
                      {formatPrice(o.totalCents, o.currency, locale)}
                    </td>
                    <td className="px-2 py-1.5 label-mono">
                      {new Date(o.createdAt).toLocaleString(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
                {summary.recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center label-mono"
                    >
                      {t("admin.dashboard.noOrders")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Star className="h-3 w-3" />
              {t("admin.dashboard.topProduct")}
            </CardTitle>
            <Sparkles className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardBody className="space-y-2">
            {summary.topProduct ? (
              <>
                <div className="text-sm font-medium leading-tight">
                  {summary.topProduct.title}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-hairline rounded-sm p-2">
                    <div className="label-mono text-muted-foreground">
                      {t("admin.dashboard.units")}
                    </div>
                    <div className="font-mono text-base tnum">
                      {summary.topProduct.unitsSold}
                    </div>
                  </div>
                  <div className="border-hairline rounded-sm p-2">
                    <div className="label-mono text-muted-foreground">
                      {t("admin.dashboard.revenue")}
                    </div>
                    <div className="font-mono text-base tnum">
                      {formatPrice(
                        summary.topProduct.revenueCents,
                        summary.topProduct.currency,
                        locale,
                      )}
                    </div>
                  </div>
                </div>
                <div className="label-mono text-muted-foreground">
                  {t("admin.dashboard.last30")}
                </div>
              </>
            ) : (
              <div className="label-mono text-muted-foreground py-4 text-center">
                {t("admin.dashboard.noTopProduct")}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="label-mono text-muted-foreground text-end">
        {t("admin.dashboard.generatedAt", {
          time: new Date(summary.generatedAt).toLocaleString(locale, {
            dateStyle: "short",
            timeStyle: "short",
          }),
        })}
      </div>
    </div>
  );
}
