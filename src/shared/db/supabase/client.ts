"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/shared/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.supabaseUrl ?? "",
    publicEnv.supabaseAnonKey ?? "",
  );
}
