# Agent: Compliance

**Trigger**: every product transition into `review` or `published` status.

## Checks (must pass ALL)
- Not in the forbidden categories (see `docs/product-policy.md`)
- No detected copyright risk (titles or content matching known protected
  works, brand names without rights, leaked-course indicators)
- No personal data inside the file (regex sweep for emails, phone numbers,
  national IDs, IBANs)
- No financial / legal advice claims that pretend to be official
- License terms set and consistent with content type

## Output
```json
{
  "decision": "pass | block",
  "violations": [
    { "rule": "string", "evidence": "string" }
  ]
}
```

A `block` decision sets `products.status = 'draft'` and writes an entry to
`audit_logs` with the violations array as `metadata`.
