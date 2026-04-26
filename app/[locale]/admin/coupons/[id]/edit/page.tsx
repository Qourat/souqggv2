import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { couponsController } from "@/modules/coupons";
import { hasSupabase } from "@/shared/db/has-supabase";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export const dynamic = "force-dynamic";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  const coupon = await couponsController.getById(id);
  if (!coupon) notFound();

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.coupons.edit")}
        subtitle={coupon.code}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}
      <CouponForm
        defaultValues={{
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderCents: coupon.minOrderCents,
          usageLimit: coupon.usageLimit ?? "",
          startsAt: toLocalInput(coupon.startsAt),
          expiresAt: toLocalInput(coupon.expiresAt),
          isActive: coupon.isActive,
        }}
      />
    </div>
  );
}
