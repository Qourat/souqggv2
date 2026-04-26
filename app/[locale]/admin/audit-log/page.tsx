import { ScrollText } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { auditController } from "@/modules/audit";
import type { AuditEntry } from "@/modules/audit";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

export default async function AdminAuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ entity?: string; action?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { entity, action, page } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const pageNum = Math.max(1, Number(page ?? 1) || 1);

  const { rows, total } = supabaseReady
    ? await auditController.list({
        entityType: entity || undefined,
        action: action || undefined,
        limit: PER_PAGE,
        offset: (pageNum - 1) * PER_PAGE,
      })
    : { rows: [] as AuditEntry[], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5 text-terracotta" />
            {t("admin.nav.auditLog")}
          </span>
        }
        subtitle={t("admin.audit.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <Link
          href="/admin/audit-log"
          className={`label-mono px-2 h-6 inline-flex items-center border-hairline rounded-sm ${
            !entity && !action
              ? "bg-terracotta text-terracotta-foreground border-terracotta"
              : "hover:bg-surface-raised"
          }`}
        >
          {t("admin.audit.filter.all")}
        </Link>
        {(
          [
            "product",
            "product_file",
            "order",
            "coupon",
            "category",
            "review",
            "ai_job",
          ] as const
        ).map((e) => (
          <Link
            key={e}
            href={`/admin/audit-log?entity=${e}`}
            className={`label-mono px-2 h-6 inline-flex items-center border-hairline rounded-sm ${
              entity === e
                ? "bg-terracotta text-terracotta-foreground border-terracotta"
                : "hover:bg-surface-raised"
            }`}
          >
            {e}
          </Link>
        ))}
        <span className="ms-auto label-mono">
          {t("admin.audit.totalCount", { count: total })}
        </span>
      </div>

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-start label-mono px-3 h-7 w-36">
                {t("admin.audit.col.when")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.audit.col.action")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-28">
                {t("admin.audit.col.entity")}
              </th>
              <th className="text-start label-mono px-2 h-7">
                {t("admin.audit.col.entityId")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.audit.col.actor")}
              </th>
              <th className="text-start label-mono px-2 h-7">
                {t("admin.audit.col.diff")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0 row-hover align-top"
              >
                <td className="px-3 py-2 label-mono">
                  {r.createdAt.toLocaleString(locale, {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </td>
                <td className="px-2 py-2">
                  <Badge variant="outline">{r.action}</Badge>
                </td>
                <td className="px-2 py-2 label-mono">{r.entityType}</td>
                <td className="px-2 py-2 font-mono text-xs">
                  {r.entityId ? r.entityId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-2 py-2 font-mono text-xs">
                  {r.actorId ? r.actorId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-2 py-2 text-xs">
                  {r.diff && Object.keys(r.diff).length > 0 ? (
                    <pre className="font-mono text-3xs whitespace-pre-wrap break-all max-w-md">
                      {JSON.stringify(r.diff, null, 0)}
                    </pre>
                  ) : (
                    <span className="label-mono">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center label-mono">
                  {t("admin.audit.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="label-mono">
            {t("admin.audit.page", { page: pageNum, total: totalPages })}
          </span>
          <div className="flex gap-1">
            {pageNum > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/audit-log?${new URLSearchParams({
                    ...(entity ? { entity } : {}),
                    ...(action ? { action } : {}),
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
                  href={`/admin/audit-log?${new URLSearchParams({
                    ...(entity ? { entity } : {}),
                    ...(action ? { action } : {}),
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
