import "server-only";

import { hasSupabase } from "@/shared/db/has-supabase";
import { demoSource } from "@/shared/db/demo-source";
import { createSupabaseServerClient } from "@/shared/db/supabase/server";

import type { CategoryRow } from "@/shared/db/schema";

import type { UpsertCategoryInput } from "./categories.schema";

export const categoriesRepository = {
  async listAll(): Promise<CategoryRow[]> {
    if (!hasSupabase()) {
      return demoSource.categories();
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CategoryRow[];
  },

  async findBySlug(slug: string): Promise<CategoryRow | null> {
    if (!hasSupabase()) {
      return demoSource.categoryBySlug(slug);
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as CategoryRow) ?? null;
  },

  async findById(id: string): Promise<CategoryRow | null> {
    if (!hasSupabase()) {
      return (
        demoSource.categories().find((c) => c.id === id) ?? null
      );
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as CategoryRow) ?? null;
  },

  async listSlugs(): Promise<string[]> {
    if (!hasSupabase()) {
      return demoSource.categorySlugs();
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("categories").select("slug");
    if (error) throw error;
    return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
  },

  async upsert(input: UpsertCategoryInput): Promise<CategoryRow> {
    const supabase = await createSupabaseServerClient();
    const payload = {
      ...(input.id ? { id: input.id } : {}),
      slug: input.slug,
      name: input.name,
      description: input.description ?? {},
      icon: input.icon ?? null,
      sort_order: input.sortOrder,
    };
    const { data, error } = await supabase
      .from("categories")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as CategoryRow;
  },

  async remove(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};
