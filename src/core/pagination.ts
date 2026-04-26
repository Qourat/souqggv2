export interface PageQuery {
  page: number;
  perPage: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
}

export const DEFAULT_PER_PAGE = 24;
export const MAX_PER_PAGE = 100;

export function parsePageQuery(
  raw: { page?: unknown; perPage?: unknown } | undefined,
): PageQuery {
  const page = Math.max(1, Number(raw?.page) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(raw?.perPage) || DEFAULT_PER_PAGE),
  );
  return { page, perPage };
}

export function buildPage<T>(
  items: T[],
  total: number,
  { page, perPage }: PageQuery,
): Page<T> {
  return {
    items,
    page,
    perPage,
    total,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function offsetOf({ page, perPage }: PageQuery): number {
  return (page - 1) * perPage;
}
