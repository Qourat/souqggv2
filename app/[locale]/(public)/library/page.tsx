import { Download } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminBanner } from "@/components/layout/admin-banner";
import { Link } from "@/shared/i18n/navigation";
import { downloadsController } from "@/modules/downloads";
import { getSessionUser } from "@/shared/auth/session";
import { hasSupabase } from "@/shared/db/has-supabase";
import { formatBytes, formatPrice } from "@/shared/utils";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  if (!hasSupabase()) {
    return (
      <div className="container py-3 space-y-3">
        <header className="space-y-1">
          <h1 className="font-mono text-lg">{t("library.title")}</h1>
        </header>
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
          <Link href="/sign-in?redirect=/library">{t("common.signIn")}</Link>
        </Button>
      </div>
    );
  }

  const items = await downloadsController.listForUser(user.id);

  if (items.length === 0) {
    return (
      <div className="container py-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="font-mono text-xl">{t("library.empty.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("library.empty.body")}</p>
        <Button asChild variant="primary" size="md">
          <Link href="/products">{t("cart.empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-3 space-y-3">
      <header className="space-y-1">
        <h1 className="font-mono text-lg">{t("library.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("library.subtitle")}
        </p>
      </header>

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
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
              <th className="text-end label-mono px-2 h-7 w-24">
                {t("library.col.price")}
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
                  <div className="label-mono">
                    {it.paidAt
                      ? new Date(it.paidAt).toLocaleDateString(locale)
                      : "—"}
                    {" · "}
                    <Link
                      href={`/library/${it.orderId}`}
                      className="hover:text-terracotta"
                    >
                      {it.orderId.slice(0, 8)}
                    </Link>
                  </div>
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
                <td className="px-2 py-2 text-end tnum text-sm">
                  {formatPrice(it.unitPriceCents, it.currency, locale)}
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
      </div>
    </div>
  );
}
