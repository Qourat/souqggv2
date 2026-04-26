import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/shared/env";

/**
 * Refresh the Supabase session inside Next middleware so server components
 * always see the current auth state.
 *
 * Silently no-ops when Supabase env vars aren't set so contributors can boot
 * the app without credentials. Auth-protected routes will still fail later
 * via `requireUser()` — which is the right place to enforce, not middleware.
 */
export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse,
) {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getUser();
  } catch {
    // If the upstream is unreachable in dev, don't block the request.
  }
  return response;
}
