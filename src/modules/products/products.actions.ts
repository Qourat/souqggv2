"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";
import { auditService } from "@/modules/audit";

import { productsService } from "./products.service";

export interface ProductActionState {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

export async function upsertProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const actor = await requireAdmin();

  const id = formData.get("id");
  const isUpdate = Boolean(id);
  const raw: Record<string, unknown> = {
    id: id || undefined,
    slug: formData.get("slug"),
    type: formData.get("type"),
    status: formData.get("status") || "draft",
    categoryId: formData.get("categoryId") || null,
    priceCents: formData.get("priceCents"),
    compareAtCents: formData.get("compareAtCents") || null,
    currency: formData.get("currency") || "USD",
    licenseType: formData.get("licenseType"),
    downloadLimit: formData.get("downloadLimit"),
    thumbnailUrl: formData.get("thumbnailUrl") || null,
    isFeatured: Boolean(formData.get("isFeatured")),
    contentLanguages: formData.getAll("contentLanguages").filter(Boolean) as string[],
    title: parseLocalized(formData, "title"),
    descriptionShort: parseLocalized(formData, "descriptionShort"),
    descriptionLong: parseLocalized(formData, "descriptionLong"),
  };

  const result = await productsService.upsert(raw);
  if (!result.ok) {
    return {
      ok: false,
      message: result.error.message,
      errors:
        (result.error.details as Record<string, string[]> | undefined) ??
        undefined,
    };
  }

  const status = String(raw.status ?? "draft");
  await auditService.log({
    actorId: actor.id,
    action:
      status === "published"
        ? isUpdate
          ? "product.publish"
          : "product.create.published"
        : isUpdate
          ? "product.update"
          : "product.create",
    entityType: "product",
    entityId: String((result.value as { id?: string }).id ?? id ?? ""),
    diff: {
      slug: raw.slug,
      status,
      type: raw.type,
      priceCents: Number(raw.priceCents ?? 0),
      isFeatured: Boolean(raw.isFeatured),
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

export async function deleteProductAction(id: string): Promise<void> {
  const actor = await requireAdmin();
  await productsService.remove(id);
  await auditService.log({
    actorId: actor.id,
    action: "product.delete",
    entityType: "product",
    entityId: id,
  });
  revalidatePath("/", "layout");
}

function parseLocalized(
  formData: FormData,
  field: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(`${field}.`) && typeof value === "string" && value) {
      out[key.slice(field.length + 1)] = value;
    }
  }
  return out;
}
