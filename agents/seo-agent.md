# Agent: SEO

## Output
- `seo_title` (≤ 60 chars; Arabic primary, English secondary as suffix)
- `seo_description` (≤ 155 chars)
- `keywords_ar` (array — primary)
- `keywords_en` (array — secondary)
- `slug` (Arabic-safe via `slugify()`; if Arabic letters are removed,
  fall back to `en` slug)
- `internal_links` (array of related product slugs to cross-link in the
  full description)

## Constraints
- Keywords must reflect actual buyer search intent (use Arabic dialect
  variants when relevant — e.g. "محل" vs "متجر").
- Slug max 80 chars.
- Title must include the primary keyword in the first 30 chars.
