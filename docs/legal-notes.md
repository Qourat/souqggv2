# souq.gg — Legal notes (engineering reference)

These are operational notes for engineers, NOT legal advice. The visible
policy pages live in `app/[locale]/(public)/legal/*`.

## Per-region

| Region | Notes |
|--------|-------|
| Saudi Arabia (KSA) | Digital products subject to 15% VAT; ZATCA e-invoicing for B2B sales above threshold. Do NOT enable B2B-VAT-invoice in MVP — show consumer receipts only. |
| UAE | 5% VAT; FTA e-invoicing roadmap unclear. Receipts must show TRN once admin sets it. |
| Egypt | 14% VAT for digital services to consumers. Currency conversion at checkout if EGP requested. |

## Receipts

Every paid order must email a receipt that includes:
- Order ID
- Date / time (UTC + buyer-local)
- Line items with Arabic + English names
- Subtotal, discount, tax (if applicable), total
- Currency
- Payment provider reference
- Refund policy link

The Resend templates live in `lib/email/templates/` (added in Sprint 3).

## Data retention

- Personal account data: deletable on user request within 30 days.
- Order / invoice records: retained 5 years (tax compliance).
- Audit logs: retained 12 months.
- Failed payments: retained 90 days then anonymized.

## DMCA & take-down

Public address: `dmca@souq.gg` (configurable via `ADMIN_EMAIL`).
First response within 72 hours. Standard counter-notice flow.
