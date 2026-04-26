import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env, publicEnv } from "@/shared/env";

/**
 * Service-role Supabase client — BYPASSES RLS. Only use from trusted server
 * code (webhooks, signed-URL routes, AI jobs). Never expose to the client.
 */
export function createSupabaseAdminClient() {
  return createClient(
    publicEnv.supabaseUrl ?? "",
    env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
      },
    },
  );
}
