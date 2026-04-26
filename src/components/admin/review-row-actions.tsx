"use client";

import { useTransition } from "react";
import { Check, EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  moderateReviewAction,
  deleteReviewAction,
} from "@/modules/reviews/reviews.actions";
import type { ReviewStatus } from "@/modules/reviews";

export function ReviewRowActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: ReviewStatus;
}) {
  const t = useTranslations();
  const [pending, start] = useTransition();

  const onSet = (status: ReviewStatus) => {
    start(async () => {
      await moderateReviewAction(id, status);
    });
  };

  const onDelete = () => {
    if (!confirm(t("admin.reviews.confirmDelete"))) return;
    start(async () => {
      await deleteReviewAction(id);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {currentStatus !== "approved" ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending}
          onClick={() => onSet("approved")}
          title={t("admin.reviews.action.approve")}
        >
          <Check className="h-3 w-3" />
        </Button>
      ) : null}
      {currentStatus !== "hidden" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => onSet("hidden")}
          title={t("admin.reviews.action.hide")}
        >
          <EyeOff className="h-3 w-3" />
        </Button>
      ) : null}
      {currentStatus !== "pending" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => onSet("pending")}
          title={t("admin.reviews.action.repend")}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onDelete}
        title={t("common.delete")}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
