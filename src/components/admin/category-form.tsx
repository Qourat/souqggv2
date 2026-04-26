"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalizedInput } from "@/components/admin/localized-input";
import {
  upsertCategoryAction,
  type CategoryActionState,
} from "@/modules/categories/categories.actions";

const initial: CategoryActionState = { ok: false };

export function CategoryForm({
  defaultValues,
}: {
  defaultValues?: {
    id?: string;
    slug?: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    icon?: string | null;
    sortOrder?: number;
  };
}) {
  const t = useTranslations();
  const [state, formAction] = useFormState(upsertCategoryAction, initial);

  return (
    <form action={formAction} className="space-y-3 max-w-xl">
      {defaultValues?.id ? (
        <input type="hidden" name="id" defaultValue={defaultValues.id} />
      ) : null}

      <LocalizedInput
        field="name"
        label={t("admin.categories.field.name")}
        required
        defaultValue={defaultValues?.name}
      />

      <LocalizedInput
        field="description"
        label={t("admin.categories.field.description")}
        multiline
        defaultValue={defaultValues?.description}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <LabeledField label={t("admin.categories.field.slug")}>
          <Input
            name="slug"
            required
            defaultValue={defaultValues?.slug ?? ""}
            placeholder="templates"
          />
        </LabeledField>
        <LabeledField label={t("admin.categories.field.icon")}>
          <Input
            name="icon"
            defaultValue={defaultValues?.icon ?? ""}
            placeholder="layout-template"
          />
        </LabeledField>
        <LabeledField label={t("admin.categories.field.sort")}>
          <Input
            type="number"
            name="sortOrder"
            min={0}
            defaultValue={defaultValues?.sortOrder ?? 0}
          />
        </LabeledField>
      </div>

      {state.message ? (
        <p
          className={`text-xs ${
            state.ok ? "text-sage" : "text-danger"
          }`}
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" size="md" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}
