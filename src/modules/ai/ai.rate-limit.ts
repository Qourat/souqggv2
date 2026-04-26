import "server-only";

/**
 * Tiny in-memory token bucket per (userId,agent). Sufficient for an
 * admin-only tool because:
 *   - Admin set is small (single-digit accounts in V1).
 *   - Each Vercel instance keeps its own counter; even with 5
 *     instances we cap at ~50 calls/min which is fine for cost.
 *   - Process restarts reset the bucket — acceptable for the
 *     "dumb-as-rocks, never paged" guarantee we want here.
 *
 * Swap for Redis (`upstash/ratelimit`) once we share buckets across
 * regions or expose any AI surface to non-admin users.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateCheck {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRate(userId: string, agent: string): RateCheck {
  const key = `${userId}:${agent}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);

  if (bucket.hits.length >= MAX_REQUESTS) {
    const oldest = bucket.hits[0];
    return {
      ok: false,
      remaining: 0,
      resetMs: WINDOW_MS - (now - oldest),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: MAX_REQUESTS - bucket.hits.length,
    resetMs: WINDOW_MS,
  };
}
