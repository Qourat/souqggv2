# Agent: Product Research

**Trigger**: admin clicks "Generate ideas" on `/admin/ai-tools`.

## Inputs
- `category` (slug) — required
- `audience` (free text, e.g. "small business owners in KSA")
- `season` (e.g. "Ramadan 2026", optional)

## Output (JSON)
```json
{
  "ideas": [
    {
      "title_ar": "string",
      "title_en": "string",
      "audience": "string",
      "problem_solved": "string",
      "suggested_price_sar": 19,
      "format": "pdf | excel | prompt_pack | template | course",
      "difficulty": "low | medium | high",
      "sales_angle": "one-line hook for the listing"
    }
  ]
}
```

## Constraints
- Arabic-first; titles must read naturally to a Khaleeji audience.
- No copyrighted material in titles or descriptions.
- Only categories from the V1 set.
- Reject ideas that overlap with `forbidden products` (see
  `docs/product-policy.md`).
