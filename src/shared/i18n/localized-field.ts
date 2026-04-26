/**
 * `LocalizedField` is the canonical shape for every multi-language string
 * stored in the database. We persist `{ "en": "...", "ar": "..." }` as JSONB
 * so adding a new locale never requires a schema migration.
 *
 *   product.title   → LocalizedField
 *   category.name   → LocalizedField
 *   product.descShort → LocalizedField (rich text plain string)
 *
 * Callers always read with `tField(record.field, locale)` which falls back
 * to English (or the first available) when a locale is missing.
 */

import { DEFAULT_LOCALE, type LocaleCode } from "./locales";

export type LocalizedField = Partial<Record<LocaleCode, string>>;

export function tField(
  field: LocalizedField | null | undefined,
  locale: string,
  fallback: LocaleCode = DEFAULT_LOCALE,
): string {
  if (!field) return "";
  const value = (field as Record<string, string | undefined>)[locale];
  if (value && value.trim().length > 0) return value;
  const fb = field[fallback];
  if (fb && fb.trim().length > 0) return fb;
  const first = Object.values(field).find((v) => v && v.trim().length > 0);
  return first ?? "";
}

export function withTranslation(
  field: LocalizedField | null | undefined,
  locale: LocaleCode,
  value: string,
): LocalizedField {
  return { ...(field ?? {}), [locale]: value };
}

export function isLocalizedField(value: unknown): value is LocalizedField {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (v) => typeof v === "string" || typeof v === "undefined",
    )
  );
}
