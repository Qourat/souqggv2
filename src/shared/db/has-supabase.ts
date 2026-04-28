import { env, publicEnv } from "@/shared/env";

function hasUsableSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function hasSupabase(): boolean {
  return Boolean(
    hasUsableSupabaseUrl(publicEnv.supabaseUrl) &&
      publicEnv.supabaseAnonKey &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
