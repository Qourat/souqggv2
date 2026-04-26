import { publicEnv } from "@/shared/env";

/**
 * True only when both env vars are set. When false, the app falls back to
 * the in-memory demo data source. This is the single source of truth — every
 * repository checks this before deciding whether to query Supabase or read
 * from the demo source.
 */
export function hasSupabase(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}
