import "server-only";

import { getLocale } from "next-intl/server";

import { categoriesService } from "./categories.service";
import type { CategoryDto } from "./categories.resource";

export const categoriesController = {
  async list(): Promise<CategoryDto[]> {
    const locale = await getLocale();
    const r = await categoriesService.listAll(locale);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async getBySlug(slug: string): Promise<CategoryDto> {
    const locale = await getLocale();
    const r = await categoriesService.getBySlug(slug, locale);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async allSlugs(): Promise<string[]> {
    const r = await categoriesService.listSlugs();
    if (!r.ok) throw r.error;
    return r.value;
  },
};
