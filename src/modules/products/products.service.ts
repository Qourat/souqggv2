import "server-only";

import { AppError, type Result, ok, err, tryAsync } from "@/core";
import { buildPage, type Page } from "@/core/pagination";

import { productsRepository } from "./products.repository";
import { toProductDto, toProductDtoList, type ProductDto } from "./products.resource";
import {
  productListQuerySchema,
  upsertProductSchema,
  type ProductListQuery,
  type UpsertProductInput,
} from "./products.schema";
import type { Product } from "./products.types";

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

  async listRelated(
    slug: string,
    locale: string,
    limit = 6,
  ): Promise<Result<ProductDto[]>> {
    const result = await tryAsync(
      () => productsRepository.findRelated(slug, limit),
      AppError.fromUnknown,
    );
    if (!result.ok) return result;
    return ok(toProductDtoList(result.value, locale));
  },

  async listAllSlugs(): Promise<Result<string[]>> {
    return tryAsync(
      () => productsRepository.listPublishedSlugs(),
      AppError.fromUnknown,
    );
  },

  async listAllForAdmin(locale: string): Promise<Result<ProductDto[]>> {
    const r = await tryAsync(
      () => productsRepository.listAllForAdmin(),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(toProductDtoList(r.value, locale));
  },

  async getByIdRaw(id: string): Promise<Result<Product | null>> {
    if (!id) return err(AppError.validation("Id required"));
    return tryAsync(
      () => productsRepository.findById(id),
      AppError.fromUnknown,
    );
  },

  async upsert(rawInput: unknown): Promise<Result<Product>> {
    const parsed = upsertProductSchema.safeParse(rawInput);
    if (!parsed.success) {
      return err(AppError.validation("Invalid input", parsed.error.format()));
    }
    return tryAsync(
      () => productsRepository.upsert(parsed.data as UpsertProductInput),
      AppError.fromUnknown,
    );
  },

  async remove(id: string): Promise<Result<true>> {
    if (!id) return err(AppError.validation("Id required"));
    const r = await tryAsync(
      () => productsRepository.remove(id),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(true);
  },
};

export type { ProductListQuery, ProductDto };
