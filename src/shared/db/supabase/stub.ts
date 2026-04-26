import "server-only";

/**
 * Stub Supabase client used when env vars aren't set. Returns empty result
 * sets so the UI renders cleanly (empty product table, zero categories,
 * zero auth user) instead of crashing. Mimics just enough of the chained
 * builder API for our repositories to work.
 */
export function createStubSupabaseClient() {
  const builder: StubBuilder = {
    select: () => builder,
    eq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    in: () => builder,
    is: () => builder,
    contains: () => builder,
    textSearch: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => Promise.resolve({ data: [], count: 0, error: null }) as never,
    single: () =>
      Promise.resolve({ data: null, error: { code: "PGRST116" } }) as never,
    maybeSingle: () =>
      Promise.resolve({ data: null, error: null }) as never,
    then: (resolve: (v: { data: never[]; count: number; error: null }) => unknown) =>
      resolve({ data: [], count: 0, error: null }),
  };

  return {
    from() {
      return builder;
    },
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
    },
    storage: {
      from() {
        return {
          createSignedUrl: async () => ({
            data: { signedUrl: "" },
            error: { message: "Storage not configured" },
          }),
          upload: async () => ({
            data: { path: "" },
            error: { message: "Storage not configured" },
          }),
          remove: async () => ({ error: null }),
        };
      },
    },
  } as unknown as ReturnType<
    typeof import("@supabase/ssr").createServerClient
  >;
}

interface StubBuilder {
  select: (...args: unknown[]) => StubBuilder;
  eq: (...args: unknown[]) => StubBuilder;
  gt: (...args: unknown[]) => StubBuilder;
  gte: (...args: unknown[]) => StubBuilder;
  lt: (...args: unknown[]) => StubBuilder;
  lte: (...args: unknown[]) => StubBuilder;
  in: (...args: unknown[]) => StubBuilder;
  is: (...args: unknown[]) => StubBuilder;
  contains: (...args: unknown[]) => StubBuilder;
  textSearch: (...args: unknown[]) => StubBuilder;
  order: (...args: unknown[]) => StubBuilder;
  limit: (...args: unknown[]) => StubBuilder;
  range: (...args: unknown[]) => Promise<{
    data: never[];
    count: number;
    error: null;
  }>;
  single: () => Promise<{ data: null; error: { code: string } }>;
  maybeSingle: () => Promise<{ data: null; error: null }>;
  then: (
    resolve: (v: { data: never[]; count: number; error: null }) => unknown,
  ) => unknown;
}
