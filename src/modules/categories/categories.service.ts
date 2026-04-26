import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";

import { categoriesRepository } from "./categories.repository";
import { toCategoryDto, type CategoryDto } from "./categories.resource";

export const categoriesService = {
  async listAll(locale: string): Promise<Result<CategoryDto[]>> {
    const r = await tryAsync(
      () => categoriesRepository.listAll(),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(r.value.map((c) => toCategoryDto(c, locale)));
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
};
