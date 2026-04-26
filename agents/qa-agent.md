# Agent: QA

## Inputs
- `product_id`
- `draft_text` and/or `draft_file_url`

## Checks
- Spelling / grammar (Arabic + English)
- Clarity (Arabic readability score)
- Usefulness (does it solve the stated problem?)
- Duplication against existing catalogue (cosine similarity over titles +
  short descriptions)
- Missing disclaimers or license terms
- Legal / safety red flags

## Output
```json
{
  "decision": "approve | reject | request_fixes",
  "issues": [
    { "severity": "low|med|high", "field": "title_ar", "note": "..." }
  ],
  "required_fixes": [ "string", "..." ]
}
```

`reject` blocks publish. `request_fixes` lets the admin save as draft.
