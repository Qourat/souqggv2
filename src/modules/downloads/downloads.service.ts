import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { hasSupabase } from "@/shared/db/has-supabase";
import { storage } from "@/shared/storage";

import { downloadsRepository } from "./downloads.repository";
import {
  toLibraryItemDto,
  type LibraryItemDto,
} from "./downloads.resource";

/**
 * Downloads service.
 *
 * Two paths matter:
 *   1. fulfilOrder(orderId, userId)
 *      Called from the Stripe webhook AFTER the order is marked paid.
 *      Joins order_items → product_files (1-N), inserts a `downloads` row
 *      per file. Idempotent: short-circuits if any download already exists
 *      for this order.
 *
 *   2. mintSignedUrl(downloadId, userId)
 *      Verifies the user owns the row, mints a 15-minute Supabase Storage
 *      signed URL, increments the counter, and returns the URL. RLS
 *      already restricts SELECT, but we double-check with the userId to
 *      be safe.
 */

export const FILES_BUCKET = "product-files";
export const DOWNLOAD_TTL_SECONDS = 15 * 60;

export interface MintedDownload {
  url: string;
  expiresAt: string;
  filename: string;
  sizeBytes: number;
}

export const downloadsService = {
  async fulfilOrder(payload: {
    orderId: string;
    userId: string | null;
    items: Array<{ orderItemId: string; productId: string }>;
  }): Promise<Result<{ created: number }>> {
    if (!hasSupabase()) {
      return err(
        AppError.dependencyDown(
          "Downloads need Supabase + storage to be configured.",
        ),
      );
    }

    const exists = await tryAsync(
      () => downloadsRepository.existsForOrder(payload.orderId),
      AppError.fromUnknown,
    );
    if (!exists.ok) return exists;
    if (exists.value) return ok({ created: 0 });

    const productIds = Array.from(
      new Set(payload.items.map((i) => i.productId)),
    );
    const filesByProduct = await tryAsync(
      () => downloadsRepository.listFilesByProductIds(productIds),
      AppError.fromUnknown,
    );
    if (!filesByProduct.ok) return filesByProduct;

    const toInsert: Array<{
      orderItemId: string;
      fileId: string;
      expiresAt: Date | null;
    }> = [];
    for (const item of payload.items) {
      const files = filesByProduct.value[item.productId] ?? [];
      for (const file of files) {
        toInsert.push({
          orderItemId: item.orderItemId,
          fileId: file.id,
          expiresAt: null,
        });
      }
    }

    if (toInsert.length === 0) return ok({ created: 0 });

    const created = await tryAsync(
      () =>
        downloadsRepository.createForOrderItems({
          userId: payload.userId,
          items: toInsert,
        }),
      AppError.fromUnknown,
    );
    if (!created.ok) return created;
    return ok({ created: created.value.length });
  },

  async mintSignedUrl(
    downloadId: string,
    userId: string,
  ): Promise<Result<MintedDownload>> {
    if (!downloadId) return err(AppError.validation("downloadId required"));
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Storage is not configured."));
    }

    const found = await tryAsync(
      () => downloadsRepository.findByIdForUser(downloadId, userId),
      AppError.fromUnknown,
    );
    if (!found.ok) return found;
    if (!found.value) return err(AppError.notFound("Download"));

    const { download, file } = found.value;
    if (
      download.expiresAt &&
      new Date(download.expiresAt).getTime() < Date.now()
    ) {
      return err(AppError.forbidden("Download window expired"));
    }

    const signed = await tryAsync(
      () =>
        storage.signedDownloadUrl({
          bucket: FILES_BUCKET,
          path: file.storagePath,
          expiresInSeconds: DOWNLOAD_TTL_SECONDS,
          download: true,
          filename: file.filename,
        }),
      AppError.fromUnknown,
    );
    if (!signed.ok) return signed;

    await tryAsync(
      () => downloadsRepository.incrementCount(downloadId),
      AppError.fromUnknown,
    );

    return ok({
      url: signed.value.url,
      expiresAt: signed.value.expiresAt.toISOString(),
      filename: file.filename,
      sizeBytes: file.sizeBytes,
    });
  },

  async listForOrder(
    orderId: string,
    locale: string,
  ): Promise<Result<LibraryItemDto[]>> {
    if (!hasSupabase()) return ok([]);
    const r = await tryAsync(
      () => downloadsRepository.listForOrder(orderId),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(r.value.map((e) => toLibraryItemDto(e, locale)));
  },

  async listForUser(
    userId: string,
    locale: string,
  ): Promise<Result<LibraryItemDto[]>> {
    if (!hasSupabase()) {
      return ok([]);
    }
    const r = await tryAsync(
      () => downloadsRepository.listForUser(userId),
      AppError.fromUnknown,
    );
    if (!r.ok) return r;
    return ok(r.value.map((e) => toLibraryItemDto(e, locale)));
  },
};
