import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type { ProductFile } from "@/modules/downloads/downloads.types";

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

export const productFilesRepository = {
  async listForProduct(productId: string): Promise<ProductFile[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("product_files")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as RawProductFile[]).map(toFile);
  },

  async findById(id: string): Promise<ProductFile | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("product_files")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? toFile(data as unknown as RawProductFile) : null;
  },

  async create(input: {
    productId: string;
    filename: string;
    storagePath: string;
    sizeBytes: number;
    mime: string | null;
    version?: number;
  }): Promise<ProductFile> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("product_files")
      .insert({
        product_id: input.productId,
        filename: input.filename,
        storage_path: input.storagePath,
        size_bytes: input.sizeBytes,
        mime: input.mime,
        version: input.version ?? 1,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toFile(data as unknown as RawProductFile);
  },

  async remove(id: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("product_files").delete().eq("id", id);
    if (error) throw error;
  },
};
