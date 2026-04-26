import { getTranslations } from "next-intl/server";

import { ReviewForm } from "@/components/reviews/review-form";
import {
  ReviewList,
  REVIEW_LIST_PAGE_SIZE,
} from "@/components/reviews/review-list";
import { Link } from "@/shared/i18n/navigation";
import { getSessionUser } from "@/shared/auth/session";
import { hasSupabase } from "@/shared/db/has-supabase";
import { reviewsController } from "@/modules/reviews";
import type { Review } from "@/modules/reviews";

/**
 * Server component mounted on the product detail page.
 *
 * Renders:
 *   1. The list of approved reviews (always, when Supabase is configured).
 *   2. A submit form, but ONLY if the signed-in user has purchased the
 *      product. Otherwise we render a tiny prompt explaining why the
 *      form is gated. Buyers who already reviewed see their review in
 *      an editable form (one row per product per user).
 */
export async function ProductReviews({
  productId,
  productSlug,
  locale,
}: {
  productId: string;
  productSlug: string;
  locale: string;
}) {
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  if (!supabaseReady) {
    return (
      <section className="space-y-2">
        <SectionHeader title={t("review.section.title")} />
        <p className="label-mono">{t("review.list.empty")}</p>
      </section>
    );
  }

  const [{ rows, total }, user] = await Promise.all([
    reviewsController.listApprovedForProduct(productId, {
      limit: REVIEW_LIST_PAGE_SIZE,
    }),
    getSessionUser(),
  ]);

  let canReview = false;
  let myReview: Review | null = null;
  if (user) {
    const purchased = await reviewsController
      .userHasPurchased(productId, user.id)
      .catch(() => ({ purchased: false, orderId: null }));
    canReview = purchased.purchased;
    if (canReview) {
      myReview = await reviewsController
        .getMyForProduct(productId, user.id)
        .catch(() => null);
    }
  }

  return (
    <section className="space-y-3">
      <SectionHeader
        title={t("review.section.title")}
        count={total}
      />

      <ReviewList rows={rows} total={total} locale={locale} />

      {!user ? (
        <p className="label-mono">
          {t("review.gate.signIn")}{" "}
          <Link href="/auth/sign-in" className="underline">
            {t("common.signIn")}
          </Link>
        </p>
      ) : canReview ? (
        <div className="border-hairline rounded-sm bg-surface px-3 py-3">
          <h3 className="label-mono mb-2">
            {myReview ? t("review.section.editTitle") : t("review.section.writeTitle")}
          </h3>
          <ReviewForm
            productId={productId}
            productSlug={productSlug}
            defaultRating={myReview?.rating}
            defaultBody={myReview?.body ?? null}
            isEdit={Boolean(myReview)}
          />
        </div>
      ) : (
        <p className="label-mono">{t("review.gate.purchaseRequired")}</p>
      )}
    </section>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <header className="flex items-baseline justify-between border-b border-border pb-1">
      <h2 className="font-mono text-sm">{title}</h2>
      {typeof count === "number" ? (
        <span className="label-mono tnum">
          {count} {count === 1 ? "review" : "reviews"}
        </span>
      ) : null}
    </header>
  );
}
