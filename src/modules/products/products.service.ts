import "server-only";

import { AppError, type Result, ok, err, tryAsync } from "@/core";
import { buildPage, type Page } from "@/core/pagination";

import { productsRepository } from "./products.repository";
import { toProductDto, toProductDtoList, type ProductDto } from "./products.resource";
import { productListQuerySchema, type ProductListQuery } from "./products.schema";

/**
 * Service = the business logic layer. Validates input, talks to repositories,
 * applies policies, transforms via resources, and returns Result<T>.
 *
 * Controllers (server actions, route handlers) are thin pass-throughs.
 */

export const productsService = {
  async list(
    rawQuery: unknown,
    locale: string,
  ): Promise<Result<Page<ProductDto>>> {
    const parsed = productListQuerySchema.safeParse(rawQuery ?? {});
    if (!parsed.success) {
      return err(AppError.validation("Invalid query", parsed.error.format()));
    }
    const q = parsed.data;

    const result = await tryAsync(
      () => productsRepository.list(q),
      AppError.fromUnknown,
    );
    if (!result.ok) return result;

    return ok(
      buildPage(toProductDtoList(result.value.items, locale), result.value.total, {
        page: q.page,
        perPage: q.perPage,
      }),
    );
  },

  async getBySlug(
    slug: string,
    locale: string,
  ): Promise<Result<ProductDto>> {
    if (!slug) return err(AppError.validation("Slug required"));
    const result = await tryAsync(
      () => productsRepository.findBySlug(slug),
      AppError.fromUnknown,
    );
    if (!result.ok) return result;
    if (!result.value) return err(AppError.notFound("Product"));
    return ok(toProductDto(result.value, locale));
  },

  async listFeatured(locale: string, limit = 6): Promise<Result<ProductDto[]>> {
    const result = await tryAsync(
      () => productsRepository.findFeatured(limit),
      AppError.fromUnknown,
    );
    if (!result.ok) return result;
    return ok(toProductDtoList(result.value, locale));
  },
};

export type { ProductListQuery, ProductDto };
