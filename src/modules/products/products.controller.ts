import "server-only";

import { getLocale } from "next-intl/server";

import { productsService } from "./products.service";
import type { ProductDto } from "./products.resource";
import type { Page } from "@/core/pagination";

/**
 * Controller = the front door called from server components, server actions,
 * and route handlers. It picks up locale, calls the service, and unwraps
 * the Result for the caller (or rethrows / returns a typed shape).
 *
 * UI components NEVER import the repository directly — they call the
 * controller. This is the seam that keeps the architecture honest.
 */

export const productsController = {
  async list(rawQuery: unknown): Promise<Page<ProductDto>> {
    const locale = await getLocale();
    const result = await productsService.list(rawQuery, locale);
    if (!result.ok) throw result.error;
    return result.value;
  },

  async featured(limit = 6): Promise<ProductDto[]> {
    const locale = await getLocale();
    const result = await productsService.listFeatured(locale, limit);
    if (!result.ok) throw result.error;
    return result.value;
  },

  async getBySlug(slug: string): Promise<ProductDto> {
    const locale = await getLocale();
    const result = await productsService.getBySlug(slug, locale);
    if (!result.ok) throw result.error;
    return result.value;
  },
};
