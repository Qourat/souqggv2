import "server-only";

import { AppError, ok, err, tryAsync, type Result } from "@/core";
import { hasSupabase } from "@/shared/db/has-supabase";
import { storage } from "@/shared/storage";
import { FILES_BUCKET } from "@/modules/downloads/downloads.service";

import { productFilesRepository } from "./product-files.repository";
import type { ProductFile } from "@/modules/downloads/downloads.types";

/**
 * Product-files service.
 *
 * Admin-only. Uploads a file via the storage adapter under
 *   {productId}/{timestamp}-{safeFilename}
 * then persists a `product_files` row pointing at that storage path.
 *
 * Storage paths are NEVER exposed publicly; the buyer-facing flow goes
 * through `/api/downloads/[id]` which re-checks ownership and mints a
 * short-lived signed URL.
 */

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "file";
}

export const productFilesService = {
  async list(productId: string): Promise<Result<ProductFile[]>> {
    if (!productId) return err(AppError.validation("productId required"));
    if (!hasSupabase()) return ok([]);
    const r = await tryAsync(
      () => productFilesRepository.listForProduct(productId),
      AppError.fromUnknown,
    );
    return r;
  },

  async upload(input: {
    productId: string;
    filename: string;
    body: ArrayBuffer | Blob | Buffer;
    sizeBytes: number;
    mime: string | null;
  }): Promise<Result<ProductFile>> {
    if (!input.productId) return err(AppError.validation("productId required"));
    if (!input.filename) return err(AppError.validation("filename required"));
    if (input.sizeBytes <= 0) return err(AppError.validation("file is empty"));
    if (input.sizeBytes > MAX_UPLOAD_BYTES) {
      return err(AppError.validation("file too large"));
    }
    if (!hasSupabase()) {
      return err(
        AppError.dependencyDown(
          "Uploads need Supabase + storage to be configured.",
        ),
      );
    }

    const path = `${input.productId}/${Date.now()}-${safeName(input.filename)}`;

    const uploaded = await tryAsync(
      () =>
        storage.upload({
          bucket: FILES_BUCKET,
          path,
          body: input.body,
          contentType: input.mime ?? undefined,
          upsert: false,
        }),
      AppError.fromUnknown,
    );
    if (!uploaded.ok) return uploaded;

    const created = await tryAsync(
      () =>
        productFilesRepository.create({
          productId: input.productId,
          filename: input.filename,
          storagePath: uploaded.value.path,
          sizeBytes: input.sizeBytes,
          mime: input.mime,
        }),
      AppError.fromUnknown,
    );
    if (!created.ok) {
      // Best-effort cleanup of orphaned blob.
      await tryAsync(
        () => storage.remove(FILES_BUCKET, [uploaded.value.path]),
        AppError.fromUnknown,
      );
      return created;
    }
    return ok(created.value);
  },

  async remove(id: string): Promise<Result<true>> {
    if (!id) return err(AppError.validation("id required"));
    if (!hasSupabase()) {
      return err(AppError.dependencyDown("Storage is not configured."));
    }
    const found = await tryAsync(
      () => productFilesRepository.findById(id),
      AppError.fromUnknown,
    );
    if (!found.ok) return found;
    if (!found.value) return err(AppError.notFound("File"));

    const removed = await tryAsync(
      () => productFilesRepository.remove(id),
      AppError.fromUnknown,
    );
    if (!removed.ok) return removed;

    await tryAsync(
      () => storage.remove(FILES_BUCKET, [found.value!.storagePath]),
      AppError.fromUnknown,
    );
    return ok(true);
  },
};
