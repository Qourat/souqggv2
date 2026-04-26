"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, type CartCoupon } from "@/modules/cart/cart.store";
import { previewCouponAction } from "@/modules/coupons/coupons.actions";

export function CartCouponInput({
  subtotalCents,
  currency,
}: {
  subtotalCents: number;
  currency: string;
}) {
  const t = useTranslations();
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 border-hairline rounded-sm bg-surface-raised px-2 h-8">
        <div className="flex items-center gap-2 min-w-0">
          <span className="label-mono text-terracotta">
            {t("cart.coupon.applied")}
          </span>
          <span className="font-mono text-xs truncate">{coupon.code}</span>
          <span className="label-mono text-muted-foreground">
            ({coupon.discountLabel})
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setCoupon(null);
            setCode("");
            setError(null);
          }}
          aria-label={t("cart.coupon.remove")}
          className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-danger rounded-sm"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder={t("cart.coupon.placeholder")}
          aria-label={t("cart.coupon.placeholder")}
          className="font-mono text-xs uppercase h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || code.trim().length === 0}
          onClick={() => {
            const trimmed = code.trim();
            if (!trimmed) return;
            start(async () => {
              const res = await previewCouponAction({
                code: trimmed,
                subtotalCents,
                currency,
              });
              if (res.ok && res.code && res.discountCents !== undefined) {
                const next: CartCoupon = {
                  code: res.code,
                  discountCents: res.discountCents,
                  totalCents: res.totalCents ?? subtotalCents,
                  discountLabel: res.discountLabel ?? "",
                  appliedAt: new Date().toISOString(),
                };
                setCoupon(next);
                setError(null);
              } else {
                setError(res.message ?? t("cart.coupon.invalid"));
              }
            });
          }}
        >
          {pending ? t("common.loading") : t("cart.coupon.apply")}
        </Button>
      </div>
      {error ? <p className="label-mono text-danger">{error}</p> : null}
    </div>
  );
}
