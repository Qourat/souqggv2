import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { getLocaleConfig } from "./i18n/locales";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price using the Intl tag of the current locale (defined in the
 * locale registry). Adding a new locale automatically picks up native digits
 * and number conventions for free.
 */
export function formatPrice(
  cents: number,
  currency = "USD",
  locale = "en",
): string {
  const tag = getLocaleConfig(locale).intlTag;
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatNumber(value: number, locale = "en"): string {
  const tag = getLocaleConfig(locale).intlTag;
  return new Intl.NumberFormat(tag).format(value);
}

/**
 * Slugify any string. Keeps Latin & Arabic letters, drops everything else,
 * and collapses runs of separators to a single dash.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\p{M}]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function formatBytes(bytes: number, locale = "en"): string {
  const tag = getLocaleConfig(locale).intlTag;
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${new Intl.NumberFormat(tag, {
    maximumFractionDigits: i === 0 ? 0 : 1,
  }).format(value)} ${units[i]}`;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
}
