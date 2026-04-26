import { setRequestLocale, getTranslations } from "next-intl/server";

import { ClearCartOnMount } from "@/components/checkout/clear-cart";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/shared/i18n/navigation";
import { ordersController } from "@/modules/orders";
import { formatPrice } from "@/shared/utils";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale } = await params;
  const { orderId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const order = orderId ? await ordersController.getById(orderId) : null;

  return (
    <div className="container py-6 max-w-xl mx-auto space-y-3">
      <ClearCartOnMount />
      <header className="space-y-1 text-center">
        <h1 className="font-mono text-2xl">{t("thankYou.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("thankYou.body")}</p>
      </header>

      {order ? (
        <Card>
          <CardBody className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="label-mono">{t("thankYou.orderId")}</span>
              <span className="label-mono tnum">{order.id.slice(0, 8)}…</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="label-mono">{t("thankYou.status")}</span>
              <span className="label-mono">
                {t(`order.status.${order.status}`)}
              </span>
            </div>
            <Separator />
            <ul className="space-y-1.5">
              {order.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm line-clamp-1">{it.title}</span>
                  <span className="label-mono tnum shrink-0">
                    ×{it.quantity}{" "}
                    {formatPrice(it.lineTotalCents, order.currency, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="label-mono">{t("cart.summary.total")}</span>
              <span className="font-mono text-md tnum">
                {formatPrice(order.totalCents, order.currency, locale)}
              </span>
            </div>
            <p className="label-mono text-muted-foreground pt-1">
              {t("thankYou.fulfilNote")}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        <Button asChild variant="primary" size="md">
          <Link href="/library">{t("thankYou.openLibrary")}</Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/products">{t("cart.empty.cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
