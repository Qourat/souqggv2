"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/shared/i18n/navigation";
import { useCartStore } from "@/modules/cart/cart.store";
import { formatPrice } from "@/shared/utils";

export function CheckoutView() {
  const t = useTranslations();
  const locale = useLocale();

  const lines = useCartStore((s) => s.lines);
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
      subtotalCents,
      savingsCents: Math.max(0, compareAtTotalCents - subtotalCents),
    };
  }, [lines]);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = lines[0]?.currency ?? "USD";
  const couponDiscount =
    coupon && coupon.discountCents > 0 ? coupon.discountCents : 0;

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          couponCode: coupon?.code,
          lines: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  }

  const totalCents = Math.max(0, summary.subtotalCents - couponDiscount);

  return (
    <div className="container py-3 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 items-start">
      <section className="space-y-3">
        <header>
          <h1 className="font-mono text-lg">{t("checkout.title")}</h1>
        </header>

        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-3 max-w-md">
              <label className="space-y-1 block">
                <span className="label-mono">{t("checkout.email")}</span>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </label>

              {error ? (
                <p className="text-xs text-danger" role="status">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={submitting || !email}
              >
                {submitting
                  ? "…"
                  : t("checkout.pay", {
                      amount: formatPrice(totalCents, currency, locale),
                    })}
              </Button>

              <ul className="space-y-1 label-mono pt-1">
                <li>· {t("checkout.trust.secure")}</li>
                <li>· {t("checkout.trust.refund")}</li>
              </ul>
            </form>
          </CardBody>
        </Card>
      </section>

      <aside className="space-y-3 lg:sticky lg:top-12 self-start">
        <Card>
          <CardBody className="space-y-2">
            <ul className="space-y-1.5">
              {lines.map((l) => (
                <li
                  key={l.productId}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm line-clamp-1">{l.title}</span>
                  <span className="label-mono tnum shrink-0">
                    ×{l.quantity}{" "}
                    {formatPrice(
                      l.unitPriceCents * l.quantity,
                      l.currency,
                      locale,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="label-mono">{t("cart.summary.subtotal")}</span>
              <span className="tnum text-sm">
                {formatPrice(summary.subtotalCents, currency, locale)}
              </span>
            </div>
            {summary.savingsCents > 0 ? (
              <div className="flex items-baseline justify-between">
                <span className="label-mono">{t("cart.summary.discount")}</span>
                <span className="tnum text-sm text-terracotta">
                  − {formatPrice(summary.savingsCents, currency, locale)}
                </span>
              </div>
            ) : null}
            {coupon && couponDiscount > 0 ? (
              <div className="flex items-baseline justify-between">
                <span className="label-mono">
                  {t("cart.summary.coupon")} · {coupon.code}
                </span>
                <span className="tnum text-sm text-terracotta">
                  − {formatPrice(couponDiscount, currency, locale)}
                </span>
              </div>
            ) : null}
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="label-mono">{t("cart.summary.total")}</span>
              <span className="font-mono text-md tnum">
                {formatPrice(totalCents, currency, locale)}
              </span>
            </div>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
