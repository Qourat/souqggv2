import "server-only";

import { createSupabaseServerClient } from "@/shared/db/supabase/server";

import type { CategoryRow } from "@/shared/db/schema";

export const categoriesRepository = {
  async listAll(): Promise<CategoryRow[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CategoryRow[];
  },

  async findBySlug(slug: string): Promise<CategoryRow | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as CategoryRow) ?? null;
  },
};
