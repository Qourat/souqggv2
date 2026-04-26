import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";

import { categoriesRepository } from "./categories.repository";
import { toCategoryDto, type CategoryDto } from "./categories.resource";
import {
  upsertCategorySchema,
  type UpsertCategoryInput,
} from "./categories.schema";
import type { CategoryRow } from "@/shared/db/schema";

export const categoriesService = {
  async listAll(locale: string): Promise<Result<CategoryDto[]>> {
    const r = await tryAsync(
      () => categoriesRepository.listAll(),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(r.value.map((c) => toCategoryDto(c, locale)));
  },

  async listAllRaw(): Promise<Result<CategoryRow[]>> {
    return tryAsync(() => categoriesRepository.listAll(), AppError.fromUnknown);
  },

  async getBySlug(slug: string, locale: string): Promise<Result<CategoryDto>> {
    if (!slug) return err(AppError.validation("Slug required"));
    const r = await tryAsync(
      () => categoriesRepository.findBySlug(slug),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    if (!r.value) return err(AppError.notFound("Category"));
    return ok(toCategoryDto(r.value, locale));
  },

  async getByIdRaw(id: string): Promise<Result<CategoryRow | null>> {
    if (!id) return err(AppError.validation("Id required"));
    return tryAsync(
      () => categoriesRepository.findById(id),
      AppError.fromUnknown,
    );
  },

  async listSlugs(): Promise<Result<string[]>> {
    return tryAsync(
      () => categoriesRepository.listSlugs(),
      AppError.fromUnknown,
    );
  },

  async upsert(rawInput: unknown): Promise<Result<CategoryRow>> {
    const parsed = upsertCategorySchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid input", parsed.error.format()));
    }
    return tryAsync(
      () => categoriesRepository.upsert(parsed.data as UpsertCategoryInput),
      AppError.fromUnknown,
    );
  },

  async remove(id: string): Promise<Result<true>> {
    if (!id) return err(AppError.validation("Id required"));
    const r = await tryAsync(
      () => categoriesRepository.remove(id),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(true);
  },
};
