"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";
import { auditService } from "@/modules/audit";

import { productFilesService } from "./product-files.service";

export interface ProductFileActionState {
  ok: boolean;
  message?: string;
  filename?: string;
}

export async function uploadProductFileAction(
  _prev: ProductFileActionState,
  formData: FormData,
): Promise<ProductFileActionState> {
  const actor = await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");

  if (!productId) return { ok: false, message: "Missing productId" };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pick a file first" };
  }

  const buffer = await file.arrayBuffer();
  const result = await productFilesService.upload({
    productId,
    filename: file.name,
    body: buffer,
    sizeBytes: file.size,
    mime: file.type || null,
  });

  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  await auditService.log({
    actorId: actor.id,
    action: "product_file.upload",
    entityType: "product_file",
    entityId: String((result.value as { id?: string }).id ?? ""),
    diff: {
      productId,
      filename: file.name,
      sizeBytes: file.size,
      mime: file.type || null,
    },
  });

  revalidatePath(`/admin/products/${productId}/files`, "page");
  return { ok: true, filename: result.value.filename, message: "Uploaded" };
}

export async function deleteProductFileAction(
  productId: string,
  fileId: string,
): Promise<void> {
  const actor = await requireAdmin();
  await productFilesService.remove(fileId);
  await auditService.log({
    actorId: actor.id,
    action: "product_file.delete",
    entityType: "product_file",
    entityId: fileId,
    diff: { productId },
  });
  revalidatePath(`/admin/products/${productId}/files`, "page");
}
