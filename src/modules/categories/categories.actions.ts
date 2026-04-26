"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";

import { categoriesService } from "./categories.service";

/**
 * Server actions = thin glue between forms and services. They:
 *   1. enforce admin role (`requireAdmin`),
 *   2. call the service,
 *   3. revalidate any cached pages,
 *   4. return a typed action result the form can show.
 */

export interface CategoryActionState {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

export async function upsertCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();

  const raw: Record<string, unknown> = {
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder") || 0,
    icon: formData.get("icon") || null,
    name: parseLocalized(formData, "name"),
    description: parseLocalized(formData, "description"),
  };

  const result = await categoriesService.upsert(raw);
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

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireAdmin();
  await categoriesService.remove(id);
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
