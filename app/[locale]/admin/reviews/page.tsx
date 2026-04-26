import { Star, MessageSquare } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReviewRowActions } from "@/components/admin/review-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/shared/i18n/navigation";
import { hasSupabase } from "@/shared/db/has-supabase";
import { reviewsController } from "@/modules/reviews";
import type { ReviewStatus, ReviewWithMeta } from "@/modules/reviews";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;
const FILTER_STATUSES: ReviewStatus[] = ["pending", "approved", "hidden"];

export default async function AdminReviewsPage({
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

  const pageNum = Math.max(1, Number(page ?? 1) || 1);
  const statusFilter = FILTER_STATUSES.includes(status as ReviewStatus)
    ? (status as ReviewStatus)
    : undefined;

  const { rows, total } = supabaseReady
    ? await reviewsController.listForAdmin({
        status: statusFilter,
        limit: PER_PAGE,
        offset: (pageNum - 1) * PER_PAGE,
        locale,
      })
    : { rows: [] as ReviewWithMeta[], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const filterChips = [undefined, ...FILTER_STATUSES] as Array<
    ReviewStatus | undefined
  >;

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-terracotta" />
            {t("admin.nav.reviews")}
          </span>
        }
        subtitle={t("admin.reviews.subtitle")}
      />

      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}

      <div className="flex items-center gap-2 text-xs flex-wrap">
        {filterChips.map((s) => {
          const href = s ? `/admin/reviews?status=${s}` : "/admin/reviews";
          const active = s ? statusFilter === s : !statusFilter;
          return (
            <Link
              key={s ?? "all"}
              href={href}
              className={`label-mono px-2 h-6 inline-flex items-center border-hairline rounded-sm ${
                active
                  ? "bg-terracotta text-terracotta-foreground border-terracotta"
                  : "hover:bg-surface-raised"
              }`}
            >
              {s ? t(`admin.reviews.filter.${s}`) : t("admin.reviews.filter.all")}
            </Link>
          );
        })}
        <span className="ms-auto label-mono">
          {t("admin.reviews.totalCount", { count: total })}
        </span>
      </div>

      <div className="border-hairline rounded-sm bg-surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-start label-mono px-3 h-7 w-32">
                {t("admin.reviews.col.when")}
              </th>
              <th className="text-start label-mono px-2 h-7">
                {t("admin.reviews.col.product")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-20">
                {t("admin.reviews.col.rating")}
              </th>
              <th className="text-start label-mono px-2 h-7">
                {t("admin.reviews.col.body")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-32">
                {t("admin.reviews.col.reviewer")}
              </th>
              <th className="text-start label-mono px-2 h-7 w-24">
                {t("admin.reviews.col.status")}
              </th>
              <th className="text-end px-2 h-7 w-44" aria-label="" />
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
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-2 py-2">
                  {r.productSlug ? (
                    <Link
                      href={`/products/${r.productSlug}`}
                      className="hover:underline text-xs"
                    >
                      {r.productTitle ?? r.productSlug}
                    </Link>
                  ) : (
                    <span className="label-mono">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center gap-0.5 tnum text-xs">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    {r.rating}
                  </span>
                </td>
                <td className="px-2 py-2 text-xs">
                  {r.body ? (
                    <p className="whitespace-pre-line line-clamp-3 max-w-xl">
                      {r.body}
                    </p>
                  ) : (
                    <span className="label-mono">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-xs">
                  {r.reviewerName || r.reviewerEmail || (
                    <span className="font-mono text-3xs">
                      {r.userId.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "sage"
                        : r.status === "hidden"
                          ? "ghost"
                          : "outline"
                    }
                  >
                    {t(`admin.reviews.filter.${r.status}`)}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-end">
                  <ReviewRowActions id={r.id} currentStatus={r.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center label-mono">
                  {t("admin.reviews.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="label-mono">
            {t("admin.reviews.page", { page: pageNum, total: totalPages })}
          </span>
          <div className="flex gap-1">
            {pageNum > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/admin/reviews?${new URLSearchParams({
                    ...(statusFilter ? { status: statusFilter } : {}),
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
                  href={`/admin/reviews?${new URLSearchParams({
                    ...(statusFilter ? { status: statusFilter } : {}),
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
