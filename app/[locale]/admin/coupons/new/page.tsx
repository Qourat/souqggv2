import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { hasSupabase } from "@/shared/db/has-supabase";

export default async function NewCouponPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.coupons.new")}
        subtitle={t("admin.coupons.newSubtitle")}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}
      <CouponForm
        defaultValues={{
          code: "",
          discountType: "percent",
          discountValue: "",
          minOrderCents: "",
          usageLimit: "",
          startsAt: "",
          expiresAt: "",
          isActive: true,
        }}
      />
    </div>
  );
}
