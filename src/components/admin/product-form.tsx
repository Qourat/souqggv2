"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalizedInput } from "@/components/admin/localized-input";
import {
  upsertProductAction,
  type ProductActionState,
} from "@/modules/products/products.actions";
import {
  PRODUCT_TYPE_VALUES,
  PRODUCT_STATUS_VALUES,
  LICENSE_TYPE_VALUES,
} from "@/modules/products/products.schema";

const initial: ProductActionState = { ok: false };

export interface ProductFormDefaults {
  id?: string;
  slug?: string;
  type?: (typeof PRODUCT_TYPE_VALUES)[number];
  status?: (typeof PRODUCT_STATUS_VALUES)[number];
  categoryId?: string | null;
  priceCents?: number;
  compareAtCents?: number | null;
  currency?: string;
  licenseType?: (typeof LICENSE_TYPE_VALUES)[number];
  downloadLimit?: number;
  thumbnailUrl?: string | null;
  isFeatured?: boolean;
  contentLanguages?: string[];
  title?: Record<string, string>;
  descriptionShort?: Record<string, string>;
  descriptionLong?: Record<string, string>;
}

export function ProductForm({
  defaultValues,
  categories,
}: {
  defaultValues?: ProductFormDefaults;
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations();
  const [state, formAction] = useFormState(upsertProductAction, initial);

  return (
    <form action={formAction} className="space-y-3 max-w-2xl">
      {defaultValues?.id ? (
        <input type="hidden" name="id" defaultValue={defaultValues.id} />
      ) : null}

      <LocalizedInput
        field="title"
        label={t("admin.products.field.title")}
        required
        defaultValue={defaultValues?.title}
      />

      <LocalizedInput
        field="descriptionShort"
        label={t("admin.products.field.descShort")}
        defaultValue={defaultValues?.descriptionShort}
        multiline
      />

      <LocalizedInput
        field="descriptionLong"
        label={t("admin.products.field.descLong")}
        defaultValue={defaultValues?.descriptionLong}
        multiline
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <LabeledField label={t("admin.products.field.slug")}>
          <Input
            name="slug"
            required
            defaultValue={defaultValues?.slug ?? ""}
            placeholder="my-cool-product"
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.type")}>
          <Select
            name="type"
            defaultValue={defaultValues?.type ?? "pdf"}
            options={PRODUCT_TYPE_VALUES.map((v) => ({
              value: v,
              label: t(`product.type.${v}`),
            }))}
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.status")}>
          <Select
            name="status"
            defaultValue={defaultValues?.status ?? "draft"}
            options={PRODUCT_STATUS_VALUES.map((v) => ({
              value: v,
              label: t(`admin.products.status.${v}`),
            }))}
          />
        </LabeledField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <LabeledField label={t("admin.products.field.priceCents")}>
          <Input
            type="number"
            name="priceCents"
            min={0}
            required
            defaultValue={defaultValues?.priceCents ?? 0}
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.compareAtCents")}>
          <Input
            type="number"
            name="compareAtCents"
            min={0}
            defaultValue={defaultValues?.compareAtCents ?? ""}
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.currency")}>
          <Input
            name="currency"
            maxLength={3}
            defaultValue={defaultValues?.currency ?? "USD"}
            placeholder="USD"
          />
        </LabeledField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <LabeledField label={t("admin.products.field.category")}>
          <Select
            name="categoryId"
            defaultValue={defaultValues?.categoryId ?? ""}
            options={[
              { value: "", label: t("admin.products.field.noCategory") },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.licenseType")}>
          <Select
            name="licenseType"
            defaultValue={defaultValues?.licenseType ?? "personal_use"}
            options={LICENSE_TYPE_VALUES.map((v) => ({
              value: v,
              label: t(`admin.products.license.${v}`),
            }))}
          />
        </LabeledField>

        <LabeledField label={t("admin.products.field.downloadLimit")}>
          <Input
            type="number"
            name="downloadLimit"
            min={1}
            max={100}
            defaultValue={defaultValues?.downloadLimit ?? 5}
          />
        </LabeledField>
      </div>

      <LabeledField label={t("admin.products.field.thumbnailUrl")}>
        <Input
          name="thumbnailUrl"
          defaultValue={defaultValues?.thumbnailUrl ?? ""}
          placeholder="https://"
        />
      </LabeledField>

      <LabeledField label={t("admin.products.field.contentLanguages")}>
        <div className="flex items-center gap-3">
          {(["en", "ar"] as const).map((code) => (
            <label
              key={code}
              className="flex items-center gap-1.5 label-mono cursor-pointer"
            >
              <input
                type="checkbox"
                name="contentLanguages"
                value={code}
                defaultChecked={
                  defaultValues?.contentLanguages?.includes(code) ?? false
                }
                className="accent-terracotta"
              />
              {code.toUpperCase()}
            </label>
          ))}
        </div>
      </LabeledField>

      <label className="flex items-center gap-1.5 label-mono cursor-pointer">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={defaultValues?.isFeatured ?? false}
          className="accent-terracotta"
        />
        {t("admin.products.field.isFeatured")}
      </label>

      {state.message ? (
        <p
          className={`text-xs ${state.ok ? "text-sage" : "text-danger"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <SubmitButton label={t("common.save")} />
      </div>
    </form>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 block">
      <span className="label-mono">{label}</span>
      {children}
    </label>
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-8 w-full bg-input border-hairline rounded-sm px-2 text-sm outline-none focus:outline-1 focus:outline-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" size="md" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}
