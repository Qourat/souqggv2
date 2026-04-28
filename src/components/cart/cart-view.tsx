"use client";

import { Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartCouponInput } from "@/components/cart/cart-coupon-input";
import { Link } from "@/shared/i18n/navigation";
import { useCartStore, type CartLine } from "@/modules/cart/cart.store";
import { formatPrice } from "@/shared/utils";

/**
 * Compact cart UI. Two columns: lines on the left, summary on the right.
 *
 * Psychology applied:
 *   - Anchoring: when there are savings vs. compare-at, surface them
 *     prominently in the summary as a single positive line ("You save").
 *   - Loss aversion: explicit per-line trash button with no confirm; the
 *     persisted store gracefully handles re-adds, so removal feels safe.
 *   - Default effect: "Continue to checkout" is the primary CTA, sized
 *     larger and terracotta-accented; "Continue shopping" is a quiet link.
 */
export function CartView() {
  const t = useTranslations();
  const locale = useLocale();

  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const coupon = useCartStore((s) => s.coupon);
  const summary = useMemo(() => {
    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.unitPriceCents * line.quantity,
      0,
    );
    const compareAtTotalCents = lines.reduce(
      (sum, line) =>
        sum + (line.compareAtCents ?? line.unitPriceCents) * line.quantity,
      0,
    );
    return {
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalCents,
      savingsCents: Math.max(0, compareAtTotalCents - subtotalCents),
    };
  }, [lines]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="container py-4">
        <div className="border-hairline rounded-sm bg-surface h-32" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container py-6 max-w-md mx-auto text-center">
        <h1 className="font-mono text-xl mb-2">{t("cart.empty.title")}</h1>
        <p className="text-sm text-muted-foreground mb-3">
          {t("cart.empty.body")}
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href="/products">{t("cart.empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  const currency = lines[0]?.currency ?? "USD";
  const couponDiscount =
    coupon && coupon.discountCents > 0 ? coupon.discountCents : 0;
  const finalTotal = Math.max(0, summary.subtotalCents - couponDiscount);

  return (
    <div className="container py-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
      <section className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h1 className="font-mono text-lg">{t("cart.title")}</h1>
          <button
            type="button"
            onClick={clear}
            className="label-mono text-muted-foreground hover:text-danger transition-colors duration-150"
          >
            {t("common.delete")} {summary.itemCount}
          </button>
        </header>

        <div className="border-hairline rounded-sm bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-start label-mono px-3 py-2 text-xs">
                  {t("shop.table.title")}
                </th>
                <th className="text-end label-mono px-2 py-2 text-xs w-20">qty</th>
                <th className="text-end label-mono px-2 py-2 text-xs w-24">
                  {t("shop.table.price")}
                </th>
                <th className="px-2 py-2 w-8" aria-label="" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <CartRow
                  key={line.productId}
                  line={line}
                  locale={locale}
                  onQty={(qty) => setQuantity(line.productId, qty)}
                  onRemove={() => remove(line.productId)}
                  removeLabel={t("cart.remove")}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-3 lg:sticky lg:top-12 self-start">
        <Card>
          <CardBody className="space-y-3">
            <SummaryRow
              label={t("cart.summary.subtotal")}
              value={formatPrice(summary.subtotalCents, currency, locale)}
            />
            {summary.savingsCents > 0 ? (
              <SummaryRow
                label={t("cart.summary.discount")}
                value={`− ${formatPrice(summary.savingsCents, currency, locale)}`}
                accent
              />
            ) : null}
            <CartCouponInput
              subtotalCents={summary.subtotalCents}
              currency={currency}
            />
            {couponDiscount > 0 ? (
              <SummaryRow
                label={t("cart.summary.coupon")}
                value={`− ${formatPrice(couponDiscount, currency, locale)}`}
                accent
              />
            ) : null}
            <Separator />
            <SummaryRow
              label={t("cart.summary.total")}
              value={formatPrice(finalTotal, currency, locale)}
              strong
            />
            <Button asChild variant="primary" size="lg" className="w-full mt-3 transition-all duration-150">
              <Link href="/checkout">{t("common.checkout")}</Link>
            </Button>
            <ul className="space-y-1 label-mono pt-2 text-xs">
              <li>· {t("checkout.trust.secure")}</li>
              <li>· {t("checkout.trust.refund")}</li>
            </ul>
          </CardBody>
        </Card>

        <Link
          href="/products"
          className="block text-center label-mono text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          ← {t("cart.empty.cta")}
        </Link>
      </aside>
    </div>
  );
}

function CartRow({
  line,
  locale,
  onQty,
  onRemove,
  removeLabel,
}: {
  line: CartLine;
  locale: string;
  onQty: (q: number) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5">
        <Link
          href={`/products/${line.slug}`}
          className="block font-medium text-sm hover:text-terracotta line-clamp-1"
        >
          {line.title}
        </Link>
      </td>
      <td className="px-2 py-2.5 text-end">
        <input
          type="number"
          min={1}
          value={line.quantity}
          onChange={(e) => onQty(Number(e.target.value || 1))}
          className="w-12 h-7 px-1.5 text-end bg-input border-hairline rounded-sm tnum focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring"
          aria-label="quantity"
        />
      </td>
      <td className="px-2 py-2.5 text-end tnum text-sm">
        {formatPrice(line.unitPriceCents * line.quantity, line.currency, locale)}
      </td>
      <td className="px-2 py-2.5 text-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-danger rounded-sm border-hairline"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </td>
    </tr>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="label-mono">{label}</span>
      <span
        className={`tnum text-sm ${
          strong ? "font-mono text-md text-foreground" : ""
        } ${accent ? "text-terracotta" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
