"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/shared/auth/session";
import { auditService } from "@/modules/audit";

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
  const actor = await requireAdmin();

  const idValue = formData.get("id");
  const isUpdate = Boolean(idValue);
  const raw: Record<string, unknown> = {
    id: idValue || undefined,
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

  await auditService.log({
    actorId: actor.id,
    action: isUpdate ? "category.update" : "category.create",
    entityType: "category",
    entityId: String((result.value as { id?: string }).id ?? idValue ?? ""),
    diff: { slug: raw.slug, sortOrder: raw.sortOrder },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

export async function deleteCategoryAction(id: string): Promise<void> {
  const actor = await requireAdmin();
  await categoriesService.remove(id);
  await auditService.log({
    actorId: actor.id,
    action: "category.delete",
    entityType: "category",
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
