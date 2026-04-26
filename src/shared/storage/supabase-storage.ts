import "server-only";

import { createSupabaseAdminClient } from "@/shared/db/supabase/admin";

import type { SignedUrlInput, StorageAdapter, UploadInput } from "./types";

export const supabaseStorage: StorageAdapter = {
  async upload({ bucket, path, body, contentType, upsert }: UploadInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, body as never, {
        contentType,
        upsert: upsert ?? false,
      });
    if (error) throw error;
    return { path: data.path };
  },

  async signedDownloadUrl({
    bucket,
    path,
    expiresInSeconds,
    download,
    filename,
  }: SignedUrlInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds, {
        download: download ? (filename ?? true) : false,
      });
    if (error) throw error;
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  },

  async remove(bucket: string, paths: string[]) {
    if (paths.length === 0) return;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
};
