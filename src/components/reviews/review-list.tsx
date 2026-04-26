import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Review } from "@/modules/reviews";

const PAGE_SIZE = 5;

export async function ReviewList({
  rows,
  total,
  locale,
}: {
  rows: Review[];
  total: number;
  locale: string;
}) {
  const t = await getTranslations();
  if (rows.length === 0) {
    return (
      <p className="label-mono py-2">{t("review.list.empty")}</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <article
          key={r.id}
          className="border-hairline rounded-sm bg-surface px-3 py-2 space-y-1.5"
        >
          <header className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 tnum text-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < r.rating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
              <span className="ms-1">{r.rating}/5</span>
            </span>
            <time
              className="label-mono"
              dateTime={r.createdAt.toISOString()}
            >
              {r.createdAt.toLocaleDateString(locale, {
                dateStyle: "medium",
              })}
            </time>
          </header>
          {r.body ? (
            <p className="text-sm whitespace-pre-line text-foreground/90">
              {r.body}
            </p>
          ) : null}
        </article>
      ))}
      {total > PAGE_SIZE ? (
        <p className="label-mono">
          {t("review.list.showing", {
            shown: rows.length,
            total,
          })}
        </p>
      ) : null}
    </div>
  );
}

export const REVIEW_LIST_PAGE_SIZE = PAGE_SIZE;
