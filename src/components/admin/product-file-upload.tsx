"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  uploadProductFileAction,
  type ProductFileActionState,
} from "@/modules/products/product-files.actions";

const initial: ProductFileActionState = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  const t = useTranslations();
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      <Upload className="h-3 w-3" />
      {pending ? t("common.loading") : t("admin.files.upload")}
    </Button>
  );
}

export function ProductFileUpload({ productId }: { productId: string }) {
  const [state, formAction] = useFormState(uploadProductFileAction, initial);
  const t = useTranslations();

  return (
    <form
      action={formAction}
      className="border-hairline rounded-sm bg-surface p-3 space-y-2"
      encType="multipart/form-data"
    >
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          required
          className="text-xs file:mr-3 file:py-1 file:px-2 file:rounded-sm file:border-hairline file:bg-surface-raised file:text-foreground file:font-mono file:text-xs hover:file:bg-muted"
        />
        <Submit />
      </div>
      {state.message ? (
        <p
          className={`label-mono ${
            state.ok ? "text-sage" : "text-danger"
          }`}
        >
          {state.message}
          {state.ok && state.filename ? ` · ${state.filename}` : ""}
        </p>
      ) : (
        <p className="label-mono text-muted-foreground">
          {t("admin.files.hint")}
        </p>
      )}
    </form>
  );
}
