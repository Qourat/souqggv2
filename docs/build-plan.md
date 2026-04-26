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

## Sprint 2 — Products

- Admin categories CRUD (RHF + Zod, server actions)
- Admin products CRUD with file upload (Supabase Storage)
- Product images: gallery upload, sort, alt text
- Public products listing: search, filters (category, type, language),
  sort (price, date, popularity), pagination
- Public product detail page (the most important sales page):
  - Hero, gallery, tabs (Overview / What's Included / Who It's For / How To Use / FAQ)
  - License terms (can/cannot do bullets)
  - Sticky purchase bar
  - Related products
  - JSON-LD `Product` structured data + per-page meta
- Slug generation (Arabic-safe via `slugify()`)

## Sprint 3 — Checkout

- Cart store (Zustand, persisted to localStorage)
- Cart page with line items, coupon input, totals
- Checkout page: email capture for guest, redirect to provider
- `/api/checkout` — creates Stripe session, persists `pending` order
- `/api/webhooks/stripe` — verify signature, idempotent, mark order `paid`,
  create `downloads` rows, enqueue email
- `/thank-you?orderId=...` — friendly receipt with first download link
- Resend confirmation email (Arabic + English)

## Sprint 4 — Downloads

- `/api/downloads/[id]` — server-only signed URL minting (15-min expiry),
  validates ownership, increments `download_count`
- `/library` — buyer's purchased products
- `/library/[orderId]` — order detail with re-download buttons
- Optional: `max_downloads_per_purchase`, `expires_at` enforcement
- Resend "your download is ready" template

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
