"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  upsertCouponAction,
  type CouponActionState,
} from "@/modules/coupons/coupons.actions";

const initial: CouponActionState = { ok: false };

interface CouponFormDefaults {
  id?: string;
  code: string;
  discountType: "percent" | "amount";
  discountValue: number | "";
  minOrderCents: number | "";
  usageLimit: number | "";
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

function Submit() {
  const { pending } = useFormStatus();
  const t = useTranslations();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? t("common.loading") : t("common.save")}
    </Button>
  );
}

function FieldRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="label-mono">
        {label}
      </label>
      {children}
      {hint ? <p className="label-mono text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CouponForm({
  defaultValues,
}: {
  defaultValues: CouponFormDefaults;
}) {
  const [state, formAction] = useFormState(upsertCouponAction, initial);
  const t = useTranslations();

  return (
    <form action={formAction} className="space-y-3 max-w-2xl">
      {defaultValues.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3">
        <FieldRow
          label={t("admin.coupons.field.code")}
          htmlFor="code"
          hint={t("admin.coupons.field.codeHint")}
        >
          <Input
            id="code"
            name="code"
            defaultValue={defaultValues.code}
            required
            className="uppercase font-mono"
          />
        </FieldRow>

        <FieldRow
          label={t("admin.coupons.field.discountType")}
          htmlFor="discountType"
        >
          <select
            id="discountType"
            name="discountType"
            defaultValue={defaultValues.discountType}
            className="h-9 w-full bg-background border-hairline rounded-sm px-2 text-sm"
          >
            <option value="percent">{t("admin.coupons.type.percent")}</option>
            <option value="amount">{t("admin.coupons.type.amount")}</option>
          </select>
        </FieldRow>

        <FieldRow
          label={t("admin.coupons.field.discountValue")}
          htmlFor="discountValue"
          hint={t("admin.coupons.field.discountValueHint")}
        >
          <Input
            id="discountValue"
            name="discountValue"
            type="number"
            min={1}
            defaultValue={defaultValues.discountValue}
            required
          />
        </FieldRow>

        <FieldRow
          label={t("admin.coupons.field.minOrder")}
          htmlFor="minOrderCents"
          hint={t("admin.coupons.field.minOrderHint")}
        >
          <Input
            id="minOrderCents"
            name="minOrderCents"
            type="number"
            min={0}
            defaultValue={defaultValues.minOrderCents}
          />
        </FieldRow>

        <FieldRow
          label={t("admin.coupons.field.usageLimit")}
          htmlFor="usageLimit"
          hint={t("admin.coupons.field.usageLimitHint")}
        >
          <Input
            id="usageLimit"
            name="usageLimit"
            type="number"
            min={1}
            defaultValue={defaultValues.usageLimit}
          />
        </FieldRow>

        <div /> {/* spacer */}

        <FieldRow
          label={t("admin.coupons.field.startsAt")}
          htmlFor="startsAt"
        >
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={defaultValues.startsAt}
          />
        </FieldRow>

        <FieldRow
          label={t("admin.coupons.field.expiresAt")}
          htmlFor="expiresAt"
        >
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={defaultValues.expiresAt}
          />
        </FieldRow>
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaultValues.isActive}
        />
        {t("admin.coupons.field.isActive")}
      </label>

      {state.message ? (
        <p
          className={`label-mono ${
            state.ok ? "text-sage" : "text-danger"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
