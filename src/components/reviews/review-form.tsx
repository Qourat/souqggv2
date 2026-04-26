"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  submitReviewAction,
  type ReviewActionState,
} from "@/modules/reviews/reviews.actions";

const initial: ReviewActionState = { ok: false };

export function ReviewForm({
  productId,
  productSlug,
  defaultRating,
  defaultBody,
  isEdit,
}: {
  productId: string;
  productSlug: string;
  defaultRating?: number;
  defaultBody?: string | null;
  isEdit?: boolean;
}) {
  const t = useTranslations();
  const [state, formAction] = useFormState(submitReviewAction, initial);
  const [rating, setRating] = useState(defaultRating ?? 5);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />

      <div className="space-y-1">
        <span className="label-mono">{t("review.form.rating")}</span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <label className="space-y-1 block">
        <span className="label-mono">{t("review.form.body")}</span>
        <textarea
          name="body"
          maxLength={2000}
          rows={4}
          defaultValue={defaultBody ?? ""}
          placeholder={t("review.form.placeholder")}
          className="flex w-full bg-input text-foreground border-hairline rounded-sm px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring"
        />
      </label>

      {state.message ? (
        <p
          className={`text-xs ${state.ok ? "text-sage" : "text-danger"}`}
          role="status"
        >
          {state.ok ? t("review.form.thanks") : state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <span className="label-mono">{t("review.form.moderationNote")}</span>
        <Submit
          label={isEdit ? t("review.form.update") : t("review.form.submit")}
        />
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" size="sm" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex gap-0.5" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-4 w-4 ${
                active ? "fill-gold text-gold" : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
