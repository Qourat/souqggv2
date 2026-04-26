# Adding a language

The whole i18n design is built so that adding a new language is a
**three-step change with no schema migration and no code changes outside
two files**.

## Step 1 — Register the locale

Edit `src/shared/i18n/locales.ts` and append one entry to the `LOCALES`
array:

```ts
{ code: "fr", label: "Français", dir: "ltr", font: "sans", intlTag: "fr-FR" }
```

| Field | What it controls |
| --- | --- |
| `code` | URL prefix (`/fr/...`) and JSONB key in the DB |
| `label` | Native name shown in the language switcher |
| `dir` | `"ltr"` or `"rtl"` (Tailwind RTL utilities pick this up) |
| `font` | `"sans"` or `"arabic"` — which CSS variable font to apply |
| `intlTag` | BCP-47 tag used by `Intl.NumberFormat` and `date-fns` |

That's enough for the routing, the language switcher, font swapping, and
RTL handling to start working.

## Step 2 — Drop a translation file

Clone `src/messages/en.json` to `src/messages/<code>.json` and translate
the values. Keys must match exactly — missing keys gracefully fall back
to English at render time.

```bash
cp src/messages/en.json src/messages/fr.json
# then translate the values
```

## Step 3 — Localize product / category content

For each product or category, add the new locale key to the JSONB
columns:

```sql
update products
set
  title             = title             || jsonb_build_object('fr', 'Modèle Notion 2026'),
  description_short = description_short || jsonb_build_object('fr', 'Système Notion clé en main'),
  description_long  = description_long  || jsonb_build_object('fr', '...')
where slug = 'notion-template-2026';
```

`tField()` falls back to English until you do this, so the site never
breaks for visitors browsing in the new locale.

## What you do **not** need to do

- ❌ Run a database migration
- ❌ Add columns
- ❌ Update the search trigger
- ❌ Touch any component
- ❌ Update routing or middleware

Once `LOCALES` and `messages/<code>.json` exist, every existing route
serves the new locale at `/<code>/...` automatically.
