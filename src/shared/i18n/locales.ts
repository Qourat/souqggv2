/**
 * Locale registry — the single source of truth for which languages the app
 * supports. Adding a new language is a three-step change:
 *
 *   1. Add an entry to `LOCALES` below (set `dir`, `label`, `font`).
 *   2. Drop a translation file at `src/messages/<code>.json`.
 *   3. (Optional) backfill the JSONB `name`/`title`/`description` columns in
 *      the database with the new locale key. Existing rows fall back to `en`
 *      until you do — so the app never crashes on missing translations.
 *
 * Anything else (routing, RTL handling, font switching, language switcher
 * UI) is derived from this registry.
 */

export type LocaleDir = "ltr" | "rtl";

export interface LocaleConfig {
  /** ISO 639-1 (or BCP-47) code used in URLs and DB keys */
  code: string;
  /** Native label shown in the language switcher */
  label: string;
  /** Text direction */
  dir: LocaleDir;
  /** Which CSS variable font family to apply on `<html>` for this locale */
  font: "sans" | "arabic";
  /** date-fns / Intl tag used by formatters (`Intl.NumberFormat(tag, ...)`) */
  intlTag: string;
}

export const LOCALES = [
  {
    code: "en",
    label: "English",
    dir: "ltr",
    font: "sans",
    intlTag: "en-US",
  },
  {
    code: "ar",
    label: "العربية",
    dir: "rtl",
    font: "arabic",
    intlTag: "ar-SA",
  },
  // To add a third locale (e.g. French), append:
  // { code: "fr", label: "Français", dir: "ltr", font: "sans", intlTag: "fr-FR" },
] as const satisfies readonly LocaleConfig[];

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_CODES: readonly LocaleCode[] = LOCALES.map((l) => l.code);

export function getLocaleConfig(code: string): LocaleConfig {
  return (LOCALES.find((l) => l.code === code) ?? LOCALES[0]) as LocaleConfig;
}

export function isLocale(code: unknown): code is LocaleCode {
  return typeof code === "string" && LOCALE_CODES.includes(code as LocaleCode);
}
