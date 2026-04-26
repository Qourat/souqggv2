# souq.gg — Build plan

This is the working sprint plan for the MVP. Updated at the end of every
sprint. Acceptance gates require human review before the next sprint begins.

## Sprint 1 — Foundation ✅

**Goal**: a deployable Next.js app with the design system, locales, DB schema,
auth + RLS scaffolding, and the homepage skeleton.

Delivered:
- Next.js 14 App Router + TypeScript strict
- Tailwind + retro-compact tokens (deep-charcoal dark / cream light)
- Fonts: JetBrains Mono (mono), Inter (sans), IBM Plex Sans Arabic (arabic)
- `next-intl` with `ar` default + `en` secondary, `localePrefix: 'always'`,
  RTL/LTR auto-switch on `<html dir>`
- Route groups: `(public) (auth) (buyer) (admin)`
- Supabase clients: browser, server, admin, middleware
- Database: `db/schema.sql` + `db/policies.sql` + `db/seed.sql` + Drizzle types
- Storage adapter (Supabase Storage; R2-ready interface)
- Payment adapter (Stripe; PayTabs-ready interface)
- Auth helpers: `getSessionUser()`, `requireUser()`, `requireAdmin()`
- Layouts: `Header`, `Footer`, `AdminSidebar`, `LocaleSwitcher`
- Homepage skeleton: hero / featured categories / best-selling / new arrivals
  / bundles / why-buy / newsletter — all sections render gracefully when DB
  is empty
- All MVP routes stubbed with `<SprintStub />` so navigation works end-to-end

## Sprint 2 — Products ✅

Delivered:
- Admin categories CRUD (server actions, Zod schema, localized inputs).
- Admin products CRUD with localized title/description/short, status,
  type, license, content languages, price/compare-at, currency, etc.
- Public products listing: search (FTS via tsvector), filters
  (category, type, language, price, rating, featured), sort, pagination.
- Public product detail page:
  - Gallery (hero + thumbs, deterministic placeholder fallback).
  - Tabs: Overview / What's Included / Who It's For / How To Use / FAQ.
  - License terms in specs sidebar.
  - Sticky buy bar with cart integration.
  - Related products (by category or type).
  - JSON-LD Product schema + per-product `generateMetadata`.
- `/categories` index → `/categories/[slug]` filtered shop view.
- Cart page (line items, qty, summary) + live header counter.
- Demo data source so the storefront browses fully without Supabase.

Deferred to Sprint 4 (downloads):
- Image upload helper (Supabase Storage signed uploads) — admin can
  paste thumbnail URL today, gallery upload UI lands with the file
  pipeline.
- Slugify helper for Arabic-aware auto-slug generation.

## Sprint 3 — Checkout (in progress)

Delivered:
- Cart store (Zustand, localStorage-persisted) with summary selectors.
- Cart page with line items, qty editing, summary, sticky checkout CTA.
- Orders module (`controller / service / repository / resource / schema`).
- `POST /api/checkout` — validates payload, re-prices server-side from DB,
  inserts `pending` order + items, creates Stripe Checkout session, returns
  hosted-checkout URL. Demo mode (no Supabase) returns a friendly error.
- `POST /api/webhooks/stripe` — verifies signature, dispatches to
  `ordersService.fulfilCheckoutCompleted` (marks order `paid`, links the
  payment intent) on `checkout.session.completed`, and to `failOrder` on
  `payment_intent.payment_failed`.
- `/checkout` page with email capture + summary; submits to API.
- `/thank-you?orderId=...` receipt page with order summary and library CTA.

Deferred to Sprint 4:
- `downloads` rows + signed URL minting.
- Resend confirmation email templates (en + ar).
- Coupon input on cart and discount calc.

## Sprint 4 — Downloads (in progress)

Delivered:
- Downloads module (`controller / service / repository / resource / types`),
  same shape as orders/ and products/.
- `downloadsService.fulfilOrder` — called from `ordersService` after
  `markPaidByOrderId` succeeds. Idempotent (short-circuits if any
  `downloads` row already exists for the order). Joins paid `order_items`
  to `product_files` and inserts one `downloads` row per file. Failures
  are logged but don't fail the webhook so it can be re-tried safely.
- `GET /api/downloads/[id]` — requires `getSessionUser`, mints a 15-minute
  Supabase Storage signed URL via the storage adapter, increments
  `download_count`, and 302-redirects to the URL.
- `/library` — buyer-only list of purchased files, with one-click download
  buttons hitting `/api/downloads/[id]`. Empty/unauth/no-DB states all
  rendered in the same retro shell.

Deferred:
- `/library/[orderId]` per-order detail page (Sprint 5 with admin orders).
- Resend "your download is ready" template (Sprint 5 with email infra).
- Coupon support and `max_downloads_per_purchase` overrides (Sprint 5).
- Admin file upload UI (lands here in Sprint 5 once admin orders are in).

## Sprint 5 — Admin & analytics

- Dashboard cards backed by real queries (revenue MTD, orders, top products,
  failed payments, draft products, coupon usage)
- Orders table with filters
- Coupon CRUD with validation server action
- Audit log viewer
- CSV export for orders

## Sprint 6 — Internal AI tools

- `/admin/ai-tools` page with one card per agent
- Agents: product description, SEO metadata, compliance check, marketing
  posts, QA checklist
- AI calls go through `/api/ai/[task]` with rate limiting (10/min admin only)
- All outputs persisted to `ai_jobs` table for review

---

## Out of scope for MVP (Phase 2 / 3 — DO NOT BUILD)

- Seller onboarding, dashboard, payouts (Phase 2)
- Open marketplace submissions (Phase 2)
- Affiliate program (Phase 3)
- Mobile app (Phase 3)
- PDF watermarking pipeline (Phase 2)
- Meilisearch / Typesense (Phase 2 — Postgres FTS is enough for MVP)
