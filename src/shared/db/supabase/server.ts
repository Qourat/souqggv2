import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env, publicEnv } from "@/shared/env";
import { hasSupabase } from "@/shared/db/has-supabase";

import { createStubSupabaseClient } from "./stub";

/**
 * SSR Supabase client — enforces RLS using the user's session JWT.
 * Use this in server components, server actions, and route handlers
 * for any read/write that should respect the caller's permissions.
 *
 * When Supabase env vars are missing (fresh checkout, no credentials yet)
 * we return a stub that responds with empty result sets so the UI still
 * renders. As soon as you set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY the real
 * client takes over with no code change.
 */
export async function createSupabaseServerClient() {
  if (!hasSupabase()) {
    return createStubSupabaseClient();
  }

  const supabaseUrl = publicEnv.supabaseUrl as string;
  const supabaseAnonKey = publicEnv.supabaseAnonKey as string;
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll fails inside server components — middleware handles refresh.
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
      },
      // Hint Supabase that the public schema is the default
      db: { schema: "public" as const },
      ...(env.NODE_ENV === "production" ? {} : {}),
    },
  );
}
