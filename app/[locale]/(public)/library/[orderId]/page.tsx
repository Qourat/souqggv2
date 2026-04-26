import { ArrowLeft, Download } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { downloadsController } from "@/modules/downloads";
import { ordersController } from "@/modules/orders";
import { getSessionUser } from "@/shared/auth/session";
import { hasSupabase } from "@/shared/db/has-supabase";
import { formatBytes, formatPrice } from "@/shared/utils";

export const dynamic = "force-dynamic";

export default async function LibraryOrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!hasSupabase()) {
    return (
      <div className="container py-3 space-y-3">
        <h1 className="font-mono text-lg">{t("library.title")}</h1>
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="container py-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="font-mono text-xl">{t("library.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("library.signInPrompt")}
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href={`/sign-in?redirect=/library/${orderId}`}>
            {t("common.signIn")}
          </Link>
        </Button>
      </div>
    );
  }

  const order = await ordersController.getByIdForUser(orderId, user.id);
  if (!order) {
    return (
      <div className="container py-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="font-mono text-xl">{t("library.order.notFound.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("library.order.notFound.body")}
        </p>
        <Button asChild variant="outline" size="md">
          <Link href="/library">
            <ArrowLeft className="h-3 w-3" />
            {t("library.order.back")}
          </Link>
        </Button>
      </div>
    );
  }

  const items = await downloadsController.listForOrder(orderId);

  return (
    <div className="container py-3 space-y-3">
      <div className="text-xs">
        <Link href="/library" className="label-mono hover:text-terracotta">
          ← {t("library.order.back")}
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="font-mono text-lg">
          {t("library.order.title", { id: order.id.slice(0, 8) })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("library.order.subtitle")}
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2 border-hairline rounded-sm bg-surface overflow-hidden">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center label-mono">
              {t("library.order.empty")}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-start label-mono px-3 h-7">
                    {t("library.col.product")}
                  </th>
                  <th className="text-start label-mono px-2 h-7 w-40">
                    {t("library.col.file")}
                  </th>
                  <th className="text-end label-mono px-2 h-7 w-20">
                    {t("library.col.size")}
                  </th>
                  <th className="text-end label-mono px-2 h-7 w-20">
                    {t("library.col.uses")}
                  </th>
                  <th className="text-end px-2 h-7 w-24" aria-label="" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.downloadId}
                    className="border-b border-border last:border-0 row-hover"
                  >
                    <td className="px-3 py-2 min-w-0">
                      <Link
                        href={`/products/${it.productSlug}`}
                        className="font-medium text-sm hover:text-terracotta line-clamp-1"
                      >
                        {it.productTitle}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="outline">{it.filename}</Badge>
                    </td>
                    <td className="px-2 py-2 text-end label-mono tnum">
                      {formatBytes(it.sizeBytes, locale)}
                    </td>
                    <td className="px-2 py-2 text-end label-mono tnum">
                      {it.downloadCount}×
                    </td>
                    <td className="px-2 py-2 text-end">
                      <Button asChild variant="primary" size="sm">
                        <a href={`/api/downloads/${it.downloadId}`}>
                          <Download className="h-3 w-3" />
                          {t("library.download")}
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="border-hairline rounded-sm bg-surface">
          <header className="px-3 h-7 flex items-center border-b border-border bg-surface-raised">
            <span className="label-mono">{t("library.order.summary")}</span>
          </header>
          <dl className="text-xs divide-y divide-border">
            <div className="flex items-center justify-between px-3 py-1.5">
              <dt className="label-mono">{t("admin.orders.detail.status")}</dt>
              <dd>
                <Badge variant="sage">{t(`order.status.${order.status}`)}</Badge>
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
            {order.discountCents > 0 ? (
              <div className="flex items-center justify-between px-3 py-1.5">
                <dt className="label-mono">
                  {t("admin.orders.detail.discount")}
                </dt>
                <dd className="tnum">
                  −{formatPrice(order.discountCents, order.currency, locale)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-raised">
              <dt className="label-mono font-bold">
                {t("admin.orders.detail.total")}
              </dt>
              <dd className="tnum font-mono text-base">
                {formatPrice(order.totalCents, order.currency, locale)}
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
