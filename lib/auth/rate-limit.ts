/**
 * Rate Limiting Middleware
 * Adapted from GODMOD3's tier-aware rate limiter — local in-memory sliding window
 * For production scale, swap to Redis-backed (interface unchanged)
 */

interface RateBucket {
  minuteRequests: number[];
  dayRequests: number[];
  totalRequests: number;
}

interface RateLimitConfig {
  perMinute: number;
  perDay: number;
  total: number; // 0 = unlimited
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const buckets = new Map<string, RateBucket>();

// Cleanup stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      bucket.minuteRequests = bucket.minuteRequests.filter(t => now - t < MINUTE_MS);
      bucket.dayRequests = bucket.dayRequests.filter(t => now - t < DAY_MS);
      if (bucket.minuteRequests.length === 0 && bucket.dayRequests.length === 0) {
        buckets.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: { minute: number; day: number; total: number } } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { minuteRequests: [], dayRequests: [], totalRequests: 0 };
    buckets.set(key, bucket);
  }

  // Clean up sliding window
  bucket.minuteRequests = bucket.minuteRequests.filter(t => now - t < MINUTE_MS);
  bucket.dayRequests = bucket.dayRequests.filter(t => now - t < DAY_MS);

  // Check limits
  if (config.total > 0 && bucket.totalRequests >= config.total) {
    return { allowed: false, remaining: { minute: 0, day: 0, total: 0 } };
  }
  if (bucket.minuteRequests.length >= config.perMinute) {
    return { allowed: false, remaining: { minute: 0, day: Math.max(0, config.perDay - bucket.dayRequests.length), total: config.total > 0 ? config.total - bucket.totalRequests : Infinity } };
  }
  if (bucket.dayRequests.length >= config.perDay) {
    return { allowed: false, remaining: { minute: Math.max(0, config.perMinute - bucket.minuteRequests.length), day: 0, total: config.total > 0 ? config.total - bucket.totalRequests : Infinity } };
  }

  // Record request
  bucket.minuteRequests.push(now);
  bucket.dayRequests.push(now);
  bucket.totalRequests++;

  return {
    allowed: true,
    remaining: {
      minute: config.perMinute - bucket.minuteRequests.length,
      day: config.perDay - bucket.dayRequests.length,
      total: config.total > 0 ? config.total - bucket.totalRequests : Infinity,
    },
  };
}

/** Rate limit configs by role */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  buyer: { perMinute: 60, perDay: 1000, total: 0 },
  seller: { perMinute: 120, perDay: 5000, total: 0 },
  agent: { perMinute: 300, perDay: 50000, total: 0 },
  admin: { perMinute: 300, perDay: 0, total: 0 },
};

/** Auth endpoint rate limits (stricter) */
export const AUTH_RATE_LIMITS: RateLimitConfig = { perMinute: 5, perDay: 50, total: 0 };