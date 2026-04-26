# Agent: Listing

## Output (fills the product editor fields)
- `title_ar`, `title_en`
- `short_description_ar`, `short_description_en` (max 160 chars each)
- `full_description_ar` (rich text — uses headings, bullets, FAQ at the end)
- `full_description_en` (parallel translation)
- `tags` (5–8, lower-case Arabic + English)
- `suggested_price`, `compare_at_price` (optional)
- `upsell_bundle_ids` (if any)

## Constraints
- Benefit-first hook in the first sentence ("احفظ 4 ساعات أسبوعيًا…").
- No fake urgency, no fake scarcity.
- Last paragraph of `full_description_ar` is always a "ماذا ستحصل" list
  (what's included).
