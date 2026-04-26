"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { deleteProductFileAction } from "@/modules/products/product-files.actions";

export function ProductFileDelete({
  productId,
  fileId,
}: {
  productId: string;
  fileId: string;
}) {
  const [pending, start] = useTransition();
  const t = useTranslations();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(t("admin.files.confirmDelete"))) return;
        start(async () => {
          await deleteProductFileAction(productId, fileId);
        });
      }}
    >
      <Trash2 className="h-3 w-3" />
      {pending ? t("common.loading") : t("common.delete")}
    </Button>
  );
}
