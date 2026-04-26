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

## Sprint 5 — Admin & analytics ✅

Delivered:
- `/admin/orders` — paginated table with status filters (all / pending / paid
  / failed / refunded), live total count, status badges (gold / sage /
  terracotta / danger), 25-per-page pagination.
- `/admin/orders/[id]` — order detail page showing line items + summary
  (subtotal, discount, total, currency, paid_at, status badge).
- Orders repository refactored to normalize Supabase snake_case columns
  to camelCase at the boundary (latent bug fix). Added `listAllForAdmin`
  with status + pagination.
- `/admin/products/[id]/files` — product files manager. Uploads via the
  storage adapter to the `product-files` bucket under `{productId}/{ts}-
  {safe-name}`, persists a `product_files` row, and lists existing files
  with delete + size + mime + version columns. 500 MB cap. Orphaned
  blobs are best-effort cleaned if the DB insert fails.
- "Manage files" link on the product edit page.
- AdminPageHeader now accepts ReactNode for title/subtitle.
- Coupons module (`controller / service / repository / schema / actions`).
  Admin CRUD at `/admin/coupons`, `/admin/coupons/new`,
  `/admin/coupons/[id]/edit`. Cart coupon input with previewCouponAction.
  Discount math centralized in `couponsService.applyToCart` and re-used
  by `ordersService.createCheckout`. `usedCount` is incremented on
  fulfilment. Cart store persists the applied coupon (v2 storage) and
  clears it whenever cart contents change.
- Analytics module (`controller / service / repository`). Live admin
  dashboard with 6 KPI cards (revenue MTD, orders MTD, pending,
  failed MTD, published products, drafts), recent-orders table, and
  top-product card (last 30d). Each KPI links into the matching admin
  filter for one-click drill-down.
- Mailer adapter under `@/shared/email` (Resend + noop fallback). New
  `notifications` module sends a "your downloads are ready" email
  (en + ar HTML + text) on `ordersService.fulfilCheckoutCompleted`,
  with one-click `/api/downloads/[id]` URLs. All failures degrade
  gracefully — paid orders are never rolled back because of email.

Deferred items from Sprint 5 — all delivered in Sprint 7 (see above):
- ~~Audit log viewer.~~ ✅
- ~~CSV export for orders.~~ ✅
- ~~`/library/[orderId]` per-order detail page.~~ ✅

## Sprint 7 — Polish & launch prep ✅ (in progress)

Delivered:
- **Reviews module** (`src/modules/reviews/`) — full
  controller/service/repository/actions/schema/types, replaces the
  Sprint-1 stub. Buyer flow: `submit()` is gated by
  `userHasPurchased()` (any paid OR fulfilled order containing the
  product) and is one-row-per-(product,user) — editing resets to
  `pending`. Admin flow: `listForAdmin({ status, locale })` returns
  reviews enriched with product + reviewer profile, `moderate()`
  flips status, `remove()` hard-deletes. Crossing the
  approved/not-approved boundary recomputes
  `products.rating_avg` + `products.rating_count` (best-effort —
  failure is logged, not raised). Every submit/moderate/remove writes
  an audit entry (`review.submit` / `review.{status}` /
  `review.delete`).
- **`/admin/reviews`** — moderation queue with status chips
  (pending/approved/hidden), 50/page pagination, locale-aware product
  titles, per-row Approve / Hide / Re-pend / Delete actions
  (`<ReviewRowActions />`), retro table.
- **Buyer review surface** on `/products/[slug]` — server component
  `<ProductReviews />` lists approved reviews (5/page), then renders
  one of: a sign-in prompt (no session), a "purchase required" note
  (signed in but didn't buy), or the `<ReviewForm />` (signed in +
  purchased, prefilled if they already reviewed).
- Sidebar entry under `admin.nav.reviews` (MessageSquare icon),
  `review` chip added to the audit-log filter row, full EN + AR
  translation parity.
- **Per-event audit hooks** wired into the remaining admin actions:
  - `products.actions.upsertProductAction` →
    `product.create` / `product.create.published` / `product.update`
    / `product.publish` (status-aware).
  - `products.actions.deleteProductAction` → `product.delete`.
  - `product-files.actions.upload/delete` →
    `product_file.upload` / `product_file.delete` with productId,
    filename, size in the diff.
  - `coupons.actions.upsert/delete` → `coupon.create` /
    `coupon.update` / `coupon.delete` with code + discount in the
    diff.
  - `categories.actions.upsert/delete` → `category.create` /
    `category.update` / `category.delete`.
  - Audit-log filter chips extended with `product_file` and
    `category` so all of the above are reachable from the UI.
- **Audit module** (`src/modules/audit/`) — service + repository + controller
  on the existing `audit_log` table. `auditService.log()` is best-effort
  (failure NEVER rolls back the calling action; logged to app logger).
  Wired into two natural events to seed the trail:
  - `ordersService.fulfilCheckoutCompleted` writes one `order.paid` entry
    per fulfilled order, with totalCents, currency, items count, and
    downloads created.
  - `aiService.run` writes one `ai.run` entry per successful agent run,
    with agent, model, provider, costUsd, and durationMs.
- **`/admin/audit-log`** — paginated viewer (50/page) with entity
  quick-filter chips (`product`, `order`, `coupon`, `ai_job`), retro
  table layout, JSON-pretty diff column, sidebar entry under
  `admin.nav.auditLog`.
- **Orders CSV export** — `GET /api/admin/orders/export?status=...`
  streams the full filtered set in pages of 500. Fields: id, created_at,
  status, email, currency, subtotal/discount/total cents, items count,
  one-line items summary, payment provider + intent id, paid_at. Strict
  CSV escaping (RFC 4180), proper `Content-Disposition` filename, audit
  entry per export. "Export CSV" button in the `/admin/orders` toolbar
  reuses the active status filter.
- **`/library/[orderId]`** — buyer-only per-order page. Loads the order
  via `ordersController.getByIdForUser` (ownership check at the service
  level — `OrderDto.userId` mismatch returns NOT_FOUND so we don't leak
  existence), then `downloadsController.listForOrder`. Same retro table
  + summary panel as the admin order detail. `OrderDto` gained a
  `userId` field; `/library` rows now deep-link to their order page; the
  thank-you page CTA opens the per-order view directly when an `orderId`
  is present.

## Sprint 6 — Internal AI tools — DONE

- `@/shared/ai` LLM adapter family: OpenAI (`gpt-4o-mini` default),
  Anthropic (`claude-3-5-haiku-latest` default), and a deterministic
  noop adapter that returns placeholder text when no API key is set.
  Each adapter normalizes message shape, surfaces token usage, and
  computes `costUsd` so `ai_jobs` always has accountable cost data.
- `ai_jobs` repository under `@/modules/ai` with `running` →
  `succeeded` / `failed` lifecycle, capturing `cost_usd`, `duration_ms`,
  parsed output, raw text, model, and provider for traceability.
- In-memory token-bucket rate limiter (10 req/min per admin × agent).
  Returns `AppError.tooManyRequests` (429) when exceeded. A Redis-
  backed implementation is the obvious next step for multi-instance
  deploys but is not needed for the MVP single-region admin team.
- Five agents shipped, each with its own descriptor, Zod input/output
  schema, and prompt builder under `@/modules/ai/agents/`:
  - `listing` — bilingual product title/short/long/tags/price
  - `seo` — meta title, description, keywords
  - `marketing` — launch posts, short ad copy
  - `qa` — drafts review for clarity/accuracy/tone
  - `compliance` — flags grey-market or rights-unclear listings before
    publish (enforces the "never grey market" policy at AI level)
- `/api/ai/[task]` POST endpoint, admin-only (`requireAdmin`), drives
  the same `aiService.run()` pipeline as the server actions: validate
  → rate-limit → log → call LLM → parse JSON → persist.
- `/admin/ai-tools` retro page: one card per agent with auto-generated
  form (text / textarea / select), live cost + latency + model display,
  copy-to-clipboard for output, and a recent-runs history table backed
  by `ai_jobs`. Buyer-facing surfaces never touch this module.

---

## Out of scope for MVP (Phase 2 / 3 — DO NOT BUILD)

- Seller onboarding, dashboard, payouts (Phase 2)
- Open marketplace submissions (Phase 2)
- Affiliate program (Phase 3)
- Mobile app (Phase 3)
- PDF watermarking pipeline (Phase 2)
- Meilisearch / Typesense (Phase 2 — Postgres FTS is enough for MVP)
