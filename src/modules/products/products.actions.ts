"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";

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
  await requireAdmin();

  const raw: Record<string, unknown> = {
    id: formData.get("id") || undefined,
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

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin();
  await productsService.remove(id);
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
