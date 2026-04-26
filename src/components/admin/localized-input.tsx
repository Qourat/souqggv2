"use client";

import { LOCALES } from "@/shared/i18n/locales";
import { cn } from "@/shared/utils";

/**
 * Compact, retro per-locale input grid. Renders one input per registered
 * language with a tiny `EN`/`AR` mono label inside a sharp-cornered shell.
 *
 * Used for `name`, `title`, `description_short`, etc. The form receives
 * keys like `name.en`, `name.ar` so the server action can recompose the
 * JSONB object on submit.
 */
export function LocalizedInput({
  field,
  label,
  required,
  defaultValue,
  multiline,
  placeholder,
}: {
  field: string;
  label: string;
  required?: boolean;
  defaultValue?: Partial<Record<string, string>>;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="label-mono">
          {label}
          {required ? <span className="text-terracotta ml-1">*</span> : null}
        </label>
        <span className="label-mono text-muted-foreground">
          {LOCALES.length}× locales
        </span>
      </div>
      <div className="grid gap-1">
        {LOCALES.map((loc) => {
          const Tag = multiline ? "textarea" : "input";
          return (
            <div
              key={loc.code}
              className="flex items-stretch border-hairline rounded-sm bg-input focus-within:outline focus-within:outline-1 focus-within:outline-ring"
            >
              <span
                className={cn(
                  "label-mono px-2 inline-flex items-center bg-surface-raised border-e border-border shrink-0 w-10 justify-center",
                )}
              >
                {loc.code.toUpperCase()}
              </span>
              <Tag
                name={`${field}.${loc.code}`}
                defaultValue={defaultValue?.[loc.code] ?? ""}
                placeholder={placeholder}
                dir={loc.dir}
                className={cn(
                  "flex-1 bg-transparent outline-none px-2 py-1.5 text-sm",
                  multiline ? "min-h-[80px] resize-y" : "h-8",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
