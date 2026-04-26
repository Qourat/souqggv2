import { supabaseStorage } from "./supabase-storage";

import type { StorageAdapter } from "./types";

/**
 * Storage adapter — currently Supabase Storage. Swap to Cloudflare R2 by
 * pointing this binding at an R2 implementation that satisfies the same
 * interface. No call sites need to change.
 */
export const storage: StorageAdapter = supabaseStorage;

export type { StorageAdapter, UploadInput, SignedUrlInput } from "./types";
