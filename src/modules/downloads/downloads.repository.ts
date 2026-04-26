import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";
import { createSupabaseServerClient } from "@/shared/db/supabase/server";

import type { Download, LibraryEntry, ProductFile } from "./downloads.types";

/**
 * Downloads repository.
 *
 * Privileged paths (creating downloads on webhook fulfilment, minting signed
 * URLs) use the admin client because RLS is configured to deny direct writes.
 * Read paths (the user's own library) go through the user-scoped server
 * client and rely on RLS to scope rows to `auth.uid()`.
 *
 * Note on column naming: Supabase returns raw snake_case column names. We
 * normalize to camelCase at the boundary so the rest of the app sees the
 * Drizzle row shape.
 */

interface RawProductFile {
  id: string;
  product_id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  mime: string | null;
  version: number;
  created_at: string;
}

interface RawDownload {
  id: string;
  order_item_id: string;
  user_id: string | null;
  file_id: string;
  download_count: number;
  expires_at: string | null;
  last_downloaded_at: string | null;
  created_at: string;
}

function toFile(r: RawProductFile): ProductFile {
  return {
    id: r.id,
    productId: r.product_id,
    filename: r.filename,
    storagePath: r.storage_path,
    sizeBytes: r.size_bytes,
    mime: r.mime,
    version: r.version,
    createdAt: new Date(r.created_at),
  };
}

function toDownload(r: RawDownload): Download {
  return {
    id: r.id,
    orderItemId: r.order_item_id,
    userId: r.user_id,
    fileId: r.file_id,
    downloadCount: r.download_count,
    expiresAt: r.expires_at ? new Date(r.expires_at) : null,
    lastDownloadedAt: r.last_downloaded_at
      ? new Date(r.last_downloaded_at)
      : null,
    createdAt: new Date(r.created_at),
  };
}

export const downloadsRepository = {
  async listFilesByProductIds(
    productIds: string[],
  ): Promise<Record<string, ProductFile[]>> {
    if (productIds.length === 0) return {};
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("product_files")
      .select("*")
      .in("product_id", productIds);
    if (error) throw error;

    const out: Record<string, ProductFile[]> = {};
    for (const f of (data ?? []) as unknown as RawProductFile[]) {
      const file = toFile(f);
      const list = out[file.productId] ?? [];
      list.push(file);
      out[file.productId] = list;
    }
    return out;
  },

  async createForOrderItems(payload: {
    userId: string | null;
    items: Array<{ orderItemId: string; fileId: string; expiresAt: Date | null }>;
  }): Promise<Download[]> {
    if (payload.items.length === 0) return [];
    const supabase = createSupabaseAdminClient();
    const rows = payload.items.map((it) => ({
      order_item_id: it.orderItemId,
      user_id: payload.userId,
      file_id: it.fileId,
      expires_at: it.expiresAt?.toISOString() ?? null,
    }));
    const { data, error } = await supabase
      .from("downloads")
      .insert(rows)
      .select("*");
    if (error) throw error;
    return ((data ?? []) as unknown as RawDownload[]).map(toDownload);
  },

  async existsForOrder(orderId: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("downloads")
      .select("id, order_items!inner(order_id)")
      .eq("order_items.order_id", orderId)
      .limit(1);
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  },

  async findByIdForUser(
    downloadId: string,
    userId: string,
  ): Promise<{
    download: Download;
    file: ProductFile;
    productId: string;
    productSlug: string;
    orderId: string;
  } | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("downloads")
      .select(
        `
        *,
        product_files:file_id (*),
        order_items:order_item_id ( order_id, product_id, products:product_id ( slug ) )
        `,
      )
      .eq("id", downloadId)
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;

    const row = data as unknown as RawDownload & {
      product_files: RawProductFile;
      order_items: {
        order_id: string;
        product_id: string;
        products: { slug: string } | null;
      };
    };
    return {
      download: toDownload(row),
      file: toFile(row.product_files),
      productId: row.order_items.product_id,
      productSlug: row.order_items.products?.slug ?? "",
      orderId: row.order_items.order_id,
    };
  },

  async incrementCount(downloadId: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { data: row, error: selErr } = await supabase
      .from("downloads")
      .select("download_count")
      .eq("id", downloadId)
      .single();
    if (selErr) throw selErr;
    const next =
      ((row as { download_count: number } | null)?.download_count ?? 0) + 1;
    const { error: updErr } = await supabase
      .from("downloads")
      .update({
        download_count: next,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", downloadId);
    if (updErr) throw updErr;
  },

  async listForUser(userId: string): Promise<LibraryEntry[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("downloads")
      .select(
        `
        *,
        product_files:file_id (*),
        order_items:order_item_id (
          id, order_id, product_id, unit_price_cents, title_snapshot,
          orders:order_id ( currency, paid_at ),
          products:product_id ( slug )
        )
        `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return ((data ?? []) as unknown as Array<
      RawDownload & {
        product_files: RawProductFile;
        order_items: {
          id: string;
          order_id: string;
          product_id: string;
          unit_price_cents: number;
          title_snapshot: Record<string, string>;
          orders: { currency: string; paid_at: string | null } | null;
          products: { slug: string } | null;
        };
      }
    >).map((row) => ({
      download: toDownload(row),
      file: toFile(row.product_files),
      productId: row.order_items.product_id,
      productSlug: row.order_items.products?.slug ?? "",
      productTitle: row.order_items.title_snapshot,
      orderId: row.order_items.order_id,
      orderItemId: row.order_items.id,
      unitPriceCents: row.order_items.unit_price_cents,
      currency: row.order_items.orders?.currency ?? "USD",
      paidAt: row.order_items.orders?.paid_at ?? null,
    }));
  },
};
