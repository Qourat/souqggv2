# SOUQ.GG — Arabic-first digital products store

> **This README is the single hand-off document for AI coding agents continuing
> work on this codebase.** It is written for an autonomous reader. If you are
> an agent picking up this repo cold, read this whole file once before
> touching anything. Then read [`AGENTS.md`](./AGENTS.md) for the working
> rules, [`docs/build-plan.md`](./docs/build-plan.md) for the sprint history,
> and [`docs/ops/server-setup.md`](./docs/ops/server-setup.md) for the
> server-side resources you will need to provision.

This is a **private repo**. Everything required to run, deploy, and extend
the project is documented here — including conventions, env vars, schema,
and operational runbooks.

---

## 0. Mission

Build and operate a **legitimate, Arabic-first digital-products store** for
the Gulf market.

- **What we sell**: PDFs, templates, prompt packs, spreadsheets, courses,
  Notion systems, code snippets, mini-courses — only **legal content with
  clear rights**. No grey-market keys, no resold content, no leaks.
- **Who we sell to**: Arabic-first buyers in Saudi Arabia and the wider
  Gulf. English is a parallel translation, not the primary market.
- **Phase**: MVP — admin-uploaded catalogue (no marketplace yet), 25-product
  launch target. Marketplace, seller onboarding, payouts, watermarking,
  Meilisearch, and a mobile app are explicitly **out of scope** for the
  MVP. See `docs/build-plan.md` § "Out of scope".
- **Compliance baseline**: never position any product as grey market. The
  AI compliance agent flags anything ambiguous before publish.

---

## 1. Tech stack at a glance

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 14** (App Router) + TypeScript strict | RSC, edge-friendly, hireable stack |
| Styling | **Tailwind CSS** + custom retro-compact tokens, `class-variance-authority`, `tailwind-merge`, `tailwindcss-animate` | Dense, fast UI; design tokens in CSS vars |
| UI primitives | **Radix UI** + custom shadcn-derived components | Accessible, headless, restyled to retro tokens |
| i18n | **`next-intl`** (en + ar today, registry-driven) | Auto RTL, URL-prefixed, generic |
| State (client) | **Zustand** (cart) + Context for theme | Tiny, no boilerplate, persists to localStorage |
| Server-fetch | **TanStack Query** (only where useful) | Most admin pages are RSC |
| Forms | **React Hook Form** + **Zod** + `useFormState` | Server-actions native |
| DB | **Supabase Postgres** + **Drizzle ORM** (TS source-of-truth) | Auth + Storage in one box, RLS native |
| Storage | **Supabase Storage** (`product-files` bucket); R2-ready adapter | Migration to Cloudflare R2 is one file |
| Payments | **Stripe** primary, MENA fallbacks via adapter (`paytabs`/`telr`/`checkout`) | Webhook-verified, idempotent fulfilment |
| Email | **Resend** + noop fallback | Transactional only (no marketing yet) |
| AI | **OpenAI** + **Anthropic** SDKs + noop fallback (admin-only) | Internal listing/SEO/QA/compliance/marketing agents |
| Hosting | **Vercel** (frontend + API) + **Supabase** (DB + Auth + Storage) | Zero-ops baseline |
| Build tools | `drizzle-kit`, `prettier`, `eslint`, `tsc --noEmit` | Standard |

Exact dependency versions live in [`package.json`](./package.json). Do not
upgrade major versions speculatively; check the changelog and run
`npm run typecheck && npm run build` after.

---

## 2. Repository map (top-level)

```
souq.v3/
├── README.md                ← you are here
├── AGENTS.md                ← AI-agent working rules (read second)
├── package.json             ← deps + scripts
├── next.config.mjs          ← next-intl plugin, image hosts
├── middleware.ts            ← intl + supabase session refresh
├── tailwind.config.ts       ← retro tokens (terracotta, sage, gold, danger)
├── tsconfig.json            ← strict, "@/*" alias = ./src/*
├── drizzle.config.ts        ← drizzle-kit config
├── .env.example             ← every env var the app reads
├── .eslintrc.json
├── .prettierrc
│
├── app/                     ← Next.js routes (THIN shells only — call modules)
│   ├── globals.css          ← Tailwind base + retro utility classes
│   ├── [locale]/
│   │   ├── layout.tsx       ← root layout, html dir/font from locale
│   │   ├── error.tsx        ← typed RSC error boundary
│   │   ├── not-found.tsx
│   │   ├── (public)/        ← shop / cart / checkout / library / legal
│   │   ├── (auth)/          ← sign-in / sign-up / forgot
│   │   └── admin/           ← gated by requireAdmin() inside pages
│   └── api/
│       ├── checkout/route.ts          ← POST cart → Stripe Checkout
│       ├── downloads/[id]/route.ts    ← signed-URL minting (15 min TTL)
│       ├── webhooks/stripe/route.ts   ← order fulfilment
│       └── ai/[task]/route.ts         ← admin-only AI agent run
│
├── src/
│   ├── core/                ← framework primitives, NO domain knowledge
│   │   ├── result.ts        ← Result<T, E>, ok/err, tryAsync
│   │   ├── errors.ts        ← AppError + factory helpers (incl. tooManyRequests)
│   │   ├── events.ts        ← typed in-process event bus
│   │   ├── pagination.ts    ← PageQuery, Page<T>
│   │   ├── logger.ts        ← structured logger (server-only)
│   │   └── index.ts         ← barrel
│   │
│   ├── shared/              ← cross-cutting kernel (env, db, auth, i18n, …)
│   │   ├── env.ts           ← Zod-validated process.env (server-only)
│   │   ├── utils.ts         ← cn, formatPrice, formatNumber, slugify, formatBytes
│   │   ├── auth/session.ts  ← getSessionUser / requireUser / requireAdmin
│   │   ├── db/
│   │   │   ├── schema.ts          ← Drizzle schema = TS source of truth
│   │   │   ├── client.ts          ← Drizzle client (server-only)
│   │   │   ├── has-supabase.ts    ← env presence check
│   │   │   ├── demo-source.ts     ← in-memory demo catalogue (dev w/o DB)
│   │   │   └── supabase/
│   │   │       ├── client.ts      ← browser client
│   │   │       ├── server.ts      ← SSR client (RLS-bound)
│   │   │       ├── admin.ts       ← service-role client (bypasses RLS)
│   │   │       ├── middleware.ts  ← session-cookie refresh
│   │   │       └── stub.ts        ← no-op when env vars missing
│   │   ├── storage/
│   │   │   ├── types.ts           ← StorageAdapter interface
│   │   │   ├── supabase-storage.ts← Supabase Storage impl
│   │   │   └── index.ts           ← active adapter export
│   │   ├── payments/
│   │   │   ├── types.ts           ← PaymentProviderAdapter
│   │   │   ├── stripe.ts          ← Stripe impl (lazy init)
│   │   │   └── index.ts
│   │   ├── email/
│   │   │   ├── types.ts           ← MailerAdapter
│   │   │   ├── resend.ts          ← Resend impl
│   │   │   ├── noop.ts            ← logs only
│   │   │   └── index.ts
│   │   ├── ai/                    ← LLM adapter family
│   │   │   ├── types.ts           ← LlmAdapter, completion shape
│   │   │   ├── openai.ts          ← gpt-4o-mini default
│   │   │   ├── anthropic.ts       ← claude-3-5-haiku-latest default
│   │   │   ├── noop.ts            ← deterministic placeholder
│   │   │   └── index.ts           ← active adapter export + isLlmConfigured
│   │   └── i18n/
│   │       ├── locales.ts         ← LOCALES registry (only file to edit
│   │       │                        when adding a language)
│   │       ├── routing.ts         ← next-intl routing config
│   │       ├── navigation.ts      ← typed Link / redirect / useRouter
│   │       ├── request.ts         ← server-side message loader
│   │       ├── localized-field.ts ← tField() — read JSONB localized values
│   │       └── index.ts
│   │
│   ├── modules/             ← domain modules (Laravel-style)
│   │   ├── products/        ← FULL stack (reference module)
│   │   ├── categories/
│   │   ├── cart/            ← Zustand store + selectors (client)
│   │   ├── auth/            ← session + role checks (controller wrapper)
│   │   ├── orders/
│   │   ├── coupons/
│   │   ├── downloads/
│   │   ├── notifications/   ← transactional email senders
│   │   ├── analytics/       ← admin dashboard aggregations
│   │   ├── ai/              ← internal AI agents (admin-only)
│   │   ├── reviews/         ← stub for now (Phase 1 polish)
│   │   └── audit/           ← stub for now (audit log viewer)
│   │
│   ├── components/
│   │   ├── ui/              ← primitives (Button, Input, Badge, Card, Skeleton)
│   │   ├── layout/          ← Header, Footer, Sidebars, banners, locale switcher
│   │   ├── products/        ← Price, Rating, ProductCard, FilterSidebar, etc.
│   │   ├── cart/            ← cart-view, coupon input
│   │   ├── checkout/        ← checkout-view, clear-cart effect
│   │   └── admin/           ← AdminPageHeader, AiRunner, forms, file upload
│   │
│   └── messages/
│       ├── en.json          ← source of truth
│       └── ar.json          ← Arabic translation (parity required)
│
├── db/                      ← canonical SQL — apply in this exact order
│   ├── schema.sql           ← extensions, enums, tables, FTS triggers, helpers
│   ├── policies.sql         ← Row-Level Security (default deny → explicit allow)
│   └── seed.sql             ← initial 7 categories
│
├── docs/
│   ├── build-plan.md        ← sprint history + what's next
│   ├── architecture.md      ← layered modules, data flow, conventions
│   ├── design-system.md     ← retro-compact tokens, psychology principles
│   ├── add-a-language.md    ← step-by-step language addition
│   ├── product-policy.md    ← what we sell / what we don't
│   ├── legal-notes.md
│   ├── roadmap.md
│   └── ops/
│       └── server-setup.md  ← Supabase + Stripe + Resend + Vercel provisioning
│
└── agents/                  ← internal AI agent specs (markdown, human-edit)
    ├── listing-agent.md
    ├── seo-agent.md
    ├── marketing-agent.md
    ├── qa-agent.md
    ├── compliance-agent.md
    ├── operations-agent.md
    ├── product-creation.md
    └── product-research.md
```

`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, `.git/` are generated and
must never be committed-as-content. They appear in `.gitignore`.

---

## 3. Architecture — Laravel-inspired layered modules

Routes are thin shells. They call a controller. The controller calls a
service. **Only repositories touch the database.**

```
   request          ──→  app/[locale]/.../page.tsx          (route shell)
                    ──→  src/modules/<name>/controller       (entry point)
                    ──→  src/modules/<name>/service          (business logic + Result<T>)
                    ──→  src/modules/<name>/repository       (Supabase / Drizzle)
                    ──→  src/modules/<name>/resource         (DTO transformer)
   response         ←──  locale-aware DTO consumed by the UI
```

Per-module file roles (Laravel parallels in brackets):

| File | Role | Laravel parallel |
| --- | --- | --- |
| `*.controller.ts` | Thin entry point called by routes / actions; unwraps `Result` | Controller |
| `*.service.ts` | Business logic, returns `Result<T, AppError>`; never throws on expected errors | Service / Action |
| `*.repository.ts` | The **only** file allowed to call Supabase / Drizzle; normalizes snake_case → camelCase | Eloquent / Repository |
| `*.schema.ts` | Zod schemas for inputs (forms, query params, API payloads) | FormRequest |
| `*.resource.ts` | Output DTO + locale resolution via `tField()` | API Resource |
| `*.policy.ts` | Authorization rules; called from the service before mutating | Policy |
| `*.actions.ts` | `"use server"` — server actions wired to forms via `useFormState` | — |
| `*.types.ts` | Domain types re-exported from the schema / Drizzle | — |
| `index.ts` | Public surface (barrel) for other modules to import from | Service Provider |

**Cross-module rules (enforced by code review)**

- A module must NEVER import another module's repository. Go through the
  other module's service or controller.
- A repository must NEVER call a service. Repositories only talk to the DB.
- All "side effects across modules" go through `src/core/events.ts` (typed
  in-process event bus) where useful, or by calling another module's
  service explicitly (preferred for the MVP — fewer hidden flows).
- No business logic in `app/` route files. Routes await a controller call
  and pass the result to a UI component. That's it.

**Result\<T, E\> pattern**

Every service method returns `Result<T, AppError>` from `src/core/result.ts`:

```ts
import { ok, err, tryAsync, type Result } from "@/core";

export const productsService = {
  async findBySlug(slug: string): Promise<Result<ProductDto>> {
    const row = await tryAsync(
      () => productsRepository.findBySlug(slug),
      AppError.fromUnknown,
    );
    if (!row.ok) return row;
    if (!row.value) return err(AppError.notFound("product"));
    return ok(toProductDto(row.value, /* locale */));
  },
};
```

Callers must handle both branches. Throw only for genuinely exceptional
states (programmer error, infra outage). All known business failures map
to `AppError` codes (`NOT_FOUND`, `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`,
`CONFLICT`, `RATE_LIMITED`, `PAYMENT_FAILED`, `STORAGE_FAILED`,
`DEPENDENCY_DOWN`, `UNKNOWN`).

---

## 4. Module reference

Each module follows the same shape; this table tells you what to look at when
you need to extend behaviour.

| Module | What it owns | Public API (`index.ts`) | Notes |
| --- | --- | --- | --- |
| `products` | Catalogue CRUD, list/filter/search, public detail | `productsController`, `productsService`, `productsPolicy`, `ProductDto`, `upsertProductSchema`, `PRODUCT_TYPE_VALUES`, etc. | Reference module — copy this layout for new modules. |
| `categories` | 7 seed categories + admin CRUD | `categoriesController`, schema, types | Localized via `name`/`description` JSONB. |
| `cart` | Client-only Zustand store, persists v2 in localStorage; lines + applied coupon | `useCartStore` | Server never trusts these prices — it re-prices from DB. |
| `orders` | Checkout pipeline: validate → re-price → create `pending` order → Stripe session → webhook → `paid` → trigger downloads + email | `ordersController`, `ordersService`, `OrderDto`, `createCheckoutSchema` | `fulfilCheckoutCompleted` is **idempotent** (download fulfilment short-circuits if rows exist). |
| `coupons` | Admin CRUD, code resolution, discount math, used-count increment on fulfilment | `couponsController`, `couponsService`, `computeDiscountCents`, schemas | `applyToCart` is the single source of truth for discount calc, used by both cart preview and checkout. |
| `downloads` | Insert one `downloads` row per `product_files` × paid `order_items`; mint 15-min Supabase signed URLs; `/library` listing | `downloadsController`, `downloadsService`, `LibraryItemDto`, `FILES_BUCKET`, `DOWNLOAD_TTL_SECONDS` | Files never get a public URL. Buyers always go through `/api/downloads/[id]`. |
| `notifications` | Transactional email (currently `download-ready` template, en + ar HTML + text) | `notificationsService` | Best-effort. **Email failure must never roll back a paid order.** |
| `analytics` | Read-only dashboard aggregations (revenue MTD, orders by status, top product, recent orders) | `analyticsController`, `analyticsService`, types | Sub-queries degrade gracefully — one failure does not break the dashboard. |
| `ai` | Internal admin-only AI agents (listing, seo, marketing, qa, compliance) + ai_jobs persistence + rate limiting | `aiController`, `aiService`, `runAgentAction`, `listAgents`, `getAgent`, `AGENT_IDS` | Buyer-facing surfaces never import this module. |
| `auth` | Wrapper around `@/shared/auth/session` for module-level access | `authController` | Real session helpers live in `src/shared/auth/session.ts`. |
| `reviews` | Stub for Phase 1 polish | `index.ts` only | Schema and RLS are already in place. |
| `audit` | Stub for Phase 1 polish (audit log viewer) | `index.ts` only | `audit_log` table exists; no UI yet. |

### How a request flows end-to-end (cart → fulfilment)

```
Buyer clicks "Checkout" on /[locale]/cart
  └── POST /api/checkout
        └── ordersController.createCheckout(payload)
              └── ordersService.createCheckout
                    ├── validate via createCheckoutSchema (Zod)
                    ├── fetch products by id from productsRepository
                    ├── re-price server-side (NEVER trust client prices)
                    ├── couponsService.applyToCart (if coupon present)
                    ├── ordersRepository.createPending(...)  ← inserts order + items
                    └── payments.createCheckoutSession(...)  ← Stripe hosted URL
        └── returns { url } → client redirects to Stripe

Stripe → POST /api/webhooks/stripe
  └── payments.verifyWebhook(body, signature)
        └── ordersService.fulfilCheckoutCompleted(orderId, paymentIntentId)
              ├── ordersRepository.markPaidByOrderId(...)  ← idempotent
              ├── couponsRepository.incrementUsedCount(...) (if any)
              ├── downloadsService.fulfilOrder(orderId)
              │     └── inserts one downloads row per product_files × paid order_item
              │     └── short-circuits if any downloads row already exists for the order
              └── notificationsService.sendDownloadReady(...)  ← best-effort

Buyer lands on /[locale]/thank-you → /[locale]/library
  └── /library lists owned downloads via downloadsService.listForUser
  └── click "Download" hits GET /api/downloads/[id]
        └── requireUser() ownership check
        └── storage.signedUrl(path, ttl=900) via Supabase Storage
        └── 302 redirect to short-lived signed URL
```

---

## 5. Routes inventory (every page + API)

**Public** (under `/[locale]/(public)/`):

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `page.tsx` | Stats strip → category chips → sort/filter → product table. The shop IS the homepage. |
| `/products` | `products/page.tsx` | Same shop view, full filter sidebar |
| `/products/[slug]` | `products/[slug]/page.tsx` | Detail: gallery, tabs (Overview/Included/For/HowTo/FAQ), specs, sticky buy bar, related, JSON-LD |
| `/categories` | `categories/page.tsx` | Category index (chips → links) |
| `/categories/[slug]` | `categories/[slug]/page.tsx` | Filtered shop view |
| `/cart` | `cart/page.tsx` | Lines, qty, summary, coupon input, sticky checkout CTA |
| `/checkout` | `checkout/page.tsx` | Email capture + summary; submits to `/api/checkout` |
| `/thank-you` | `thank-you/page.tsx` | Receipt + CTA to library |
| `/library` | `library/page.tsx` | Owned files, one-click `/api/downloads/[id]` buttons |
| `/account` | `account/page.tsx` | Profile (current minimal) |
| `/bundles` | `bundles/page.tsx` | Phase 2 stub |
| `/legal/{terms,privacy,refund,downloads,acceptable-use,dmca}` | `legal/.../page.tsx` | Static legal pages — content review still pending |

**Auth** (under `/[locale]/(auth)/`):

| Route | Purpose |
| --- | --- |
| `/sign-in` | Email/password + Google OAuth + magic link (Supabase Auth) |
| `/sign-up` | Email/password sign-up |
| `/forgot-password` | Magic-link reset |

**Admin** (under `/[locale]/admin/`, every page calls `requireAdmin()`):

| Route | Purpose |
| --- | --- |
| `/admin` | Live dashboard: 6 KPI cards (revenue MTD, orders MTD, pending, failed MTD, published, drafts) + recent orders table + top product (30d). Each KPI links to filtered admin view. |
| `/admin/products` | Catalogue table |
| `/admin/products/new` | Create product (localized title/desc, type, status, license, content langs, price/compare-at) |
| `/admin/products/[id]/edit` | Edit product |
| `/admin/products/[id]/files` | Manage `product_files` — uploads via storage adapter (500 MB cap), list with size/mime/version, delete |
| `/admin/categories` | Categories table |
| `/admin/categories/new` | Create category |
| `/admin/categories/[id]/edit` | Edit category |
| `/admin/orders` | Orders list, status filter, 25/page pagination |
| `/admin/orders/[id]` | Order detail — items, summary, status, paid_at |
| `/admin/coupons` | Coupons table |
| `/admin/coupons/new` | Create coupon (percent/amount, min order, usage limit, window, active flag) |
| `/admin/coupons/[id]/edit` | Edit coupon |
| `/admin/analytics` | Reserved (links from dashboard cards) |
| `/admin/users` | Reserved |
| `/admin/ai-tools` | Internal AI agents — card per agent, auto-generated form, live cost+latency+model display, copy-to-clipboard, recent-runs history table |

**API routes** (under `app/api/`):

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/checkout` | POST | Cart → re-price → Stripe Checkout session → URL |
| `/api/webhooks/stripe` | POST | Verify signature, fulfil order, send email, increment coupon usage |
| `/api/downloads/[id]` | GET | Owner check → mint 15-min signed URL → 302 redirect |
| `/api/ai/[task]` | POST | Admin-only — run an AI agent through `aiService.run()` |

`middleware.ts` runs `next-intl` routing + Supabase session refresh on
every non-API non-asset request.

---

## 6. Database (everything that lives on the server, not in this repo)

The database lives in **Supabase Postgres** and is the single source of
truth at runtime. The repo contains the canonical SQL to recreate it.

### 6.1 What's in the repo (apply in this order)

1. `db/schema.sql` — `pgcrypto`, `uuid-ossp`, `pg_trgm` extensions; enums;
   tables; `localized()` and `localized_tsv()` helper functions;
   `touch_updated_at()` and `handle_new_user()` triggers; FTS triggers on
   `products`.
2. `db/policies.sql` — `is_admin()` helper + Row-Level Security policies
   (default deny → explicit allow per table). Public reads only what is
   `published`/`approved`; everything else is owner-or-admin.
3. `db/seed.sql` — 7 categories (templates, spreadsheets, prompts, ebooks,
   code, notion, courses) with bilingual names/descriptions.

### 6.2 Tables (full list)

| Table | Purpose | RLS summary |
| --- | --- | --- |
| `profiles` | Mirrors `auth.users`; `role` enum (`buyer` / `admin`), `preferred_locale` | Self-read/update; admin all |
| `categories` | Top-level shop sections | Public read; admin write |
| `products` | Catalogue. Localized JSONB title/description; `tsvector search_text` rebuilt by trigger | Public read where `status = 'published'`; admin all |
| `product_files` | One blob per file. `storage_path` is the Supabase Storage object key | Admin only — buyers never see these directly |
| `orders` | Checkout outcome. Status enum (`pending`/`paid`/`fulfilled`/`refunded`/`failed`/`cancelled`); `payment_intent_id` unique | Owner read; admin all |
| `order_items` | Snapshot of title + price at purchase time | Visible if you own parent order; admin all |
| `downloads` | One row per `product_files` × paid `order_items`; `download_count` + `expires_at` | Owner read; admin all |
| `coupons` | Promo codes; `discount_type` (`percent`/`amount`), `min_order_cents`, `usage_limit`, `used_count`, time window | Admin only (no leaking active codes) |
| `reviews` | Buyer reviews. Status enum (`pending`/`approved`/`hidden`) | Public reads `approved`; users edit own; admin delete |
| `ai_jobs` | Every internal AI agent run with `cost_usd`, `duration_ms`, `input`, `output`, `error`, `created_by` | Admin only |
| `audit_log` | `actor_id`, `action`, `entity_type/id`, `diff` JSONB | Admin only |
| `newsletter_subscribers` | Email + locale; insert open to anyone, read admin-only | Public insert; admin read/write |

### 6.3 Storage (Supabase Storage)

- Bucket: **`product-files`** — **private** (no public access). Object keys:
  `{productId}/{timestamp}-{safe-filename}`.
- Buyer-facing access is always via `GET /api/downloads/[id]`, which
  checks ownership in `downloads`/`order_items`/`orders` and mints a
  15-minute signed URL. The signed URL is the only thing the browser
  ever sees.
- Maximum upload size enforced in the admin file-upload action: **500 MB**.
- See `docs/ops/server-setup.md` for bucket creation steps.

### 6.4 Auth (Supabase Auth)

- Email/password is enabled. Magic-link is enabled. Google OAuth is
  optional — set the Google provider in Supabase if you want it.
- The `handle_new_user()` trigger copies new `auth.users` into `profiles`
  with a default role of `buyer`.
- To grant admin: `update profiles set role = 'admin' where id = '<uuid>';`
- `requireAdmin()` in `src/shared/auth/session.ts` enforces it server-side
  on every admin route and admin server action.

### 6.5 Migrations

- The Drizzle schema in `src/shared/db/schema.ts` is the **TS source of
  truth**. The SQL files in `db/` must stay in sync with it.
- `npm run db:generate` writes a new SQL migration into `db/migrations/`.
- `npm run db:push` applies the schema directly (use only in dev).
- Any new column / table requires updating BOTH the Drizzle schema AND
  the canonical `db/schema.sql` + `db/policies.sql` so cold-start setup
  still works.

### 6.6 Things that are NOT in the repo (and shouldn't be)

- `.env.local` — secrets only
- Live Stripe keys (use test keys in dev)
- Live Resend keys
- OpenAI / Anthropic keys
- Real product files (Supabase Storage bucket only)
- Customer data, order data, audit log

---

## 7. Environment variables (every one)

Source-of-truth schema: [`src/shared/env.ts`](./src/shared/env.ts) (Zod-
validated at startup; warnings are logged for missing optional vars but
the app boots in degraded mode).

Template: [`.env.example`](./.env.example).

| Variable | Required for | Where to get it | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Always | Your URL | `http://localhost:3000` in dev; full https URL in prod. Used by emails + Stripe success/cancel URLs. |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, DB, Storage | Supabase project → Settings → API | Public (NEXT_PUBLIC_) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth, DB (RLS-bound) | Supabase project → Settings → API | Public — RLS protects everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin server-side ops, downloads signed URL minting, AI jobs | Supabase project → Settings → API | **Server-only.** Never expose in browser. |
| `DATABASE_URL` | Drizzle Kit (`db:generate`/`db:push`/`db:studio`) and any background jobs | Supabase project → Settings → Database → "Connection string" (Direct connection, not pooler) | Server-only |
| `STRIPE_SECRET_KEY` | Checkout, webhook verify | Stripe dashboard → Developers → API keys | Use `sk_test_*` in dev |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Stripe dashboard → Webhooks → endpoint → "Signing secret" | Different per environment. Local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints one. |
| `RESEND_API_KEY` | "Download ready" email | Resend dashboard → API keys | If unset, mailer falls back to noop (logs only); paid orders are NOT rolled back. |
| `OPENAI_API_KEY` | Internal AI tools (priority 1) | OpenAI dashboard | Defaults to `gpt-4o-mini`. If both this and `ANTHROPIC_API_KEY` are unset the AI tools page shows a "stub mode" banner and runs the noop adapter. |
| `ANTHROPIC_API_KEY` | Internal AI tools (priority 2) | Anthropic console | Defaults to `claude-3-5-haiku-latest`. Used only if `OPENAI_API_KEY` is missing. |

The app **boots and renders the storefront** with NONE of these set —
demo data takes over and admin features show "Supabase not configured"
banners. This makes onboarding agents and humans equally fast.

---

## 8. Local setup (zero-to-dev in 5 commands)

Prereqs: **Node 20.x** (Vercel uses 20), npm 10+, git. Optional: Stripe CLI
for webhook tunnelling.

```bash
git clone <repo-url> souq.v3
cd souq.v3
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` — the storefront renders against the
in-memory demo catalogue. Switch language via the locale switcher
(top-right). Visit `/admin/*` to see the Supabase-not-configured banners.

To wire the database, follow [`docs/ops/server-setup.md`](./docs/ops/server-setup.md).

---

## 9. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server (Turbopack-free, plain Webpack — Next 14) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (Next.js preset) |
| `npm run typecheck` | `tsc --noEmit` — **must pass before every commit** |
| `npm run format` | Prettier write across `*.{ts,tsx,md,json,css}` |
| `npm run db:generate` | Drizzle Kit — generate SQL migration from `schema.ts` diff |
| `npm run db:push` | Drizzle Kit — push schema directly (dev only) |
| `npm run db:studio` | Drizzle Studio — visual DB browser |

---

## 10. Internationalization (i18n)

The whole point of the design: **adding a third language is a 3-step
change, no schema migration**.

1. Add an entry to `src/shared/i18n/locales.ts` (`code`, `label`, `dir`,
   `font`, `intlTag`).
2. Drop a translation file at `src/messages/<code>.json` — clone `en.json`
   and translate values. Missing keys silently fall back to English.
3. Translate product/category content by adding the locale key to JSONB
   columns — the `localized()` SQL function and the TS `tField()` helper
   fall back to `en` until you do.

That's it. The language switcher, RTL, font swap, URL prefixing
(`localePrefix: 'always'`), and FTS all read from the registry.

Conventions:

- Source-of-truth language in code & comments: **English**.
- Source-of-truth language for buyers: **Arabic**.
- Every user-visible string MUST come from `src/messages/*.json`. **No
  hard-coded strings in components**, including admin pages.
- All user-facing string DB columns are JSONB `{ "en": "...", "ar": "..." }`.

---

## 11. Design system (retro-compact)

The full ruleset lives in [`docs/design-system.md`](./docs/design-system.md).
Quick reference for agents:

- **Dark mode default** with cream light alternative. Tokens are CSS
  variables defined in `app/globals.css` and consumed via
  `tailwind.config.ts`.
- Accent: **terracotta** (single attention-grabbing color, Von Restorff).
  Other semantic colors: `sage` (success/active), `gold` (warning/featured),
  `danger` (errors).
- Fonts: **JetBrains Mono** (headings/metadata), **Inter** (body),
  **IBM Plex Sans Arabic** (Arabic locale). `<html dir>` and font swap
  derive from the active locale.
- Spacing is dense (`gap-1.5`, `gap-2` over `gap-4`). Sharp edges
  (`rounded-sm`). Hairline borders via `.border-hairline`. Tabular
  numbers on every numeric column via `.tnum`.
- The homepage **is the shop**. No hero, no banner, no "why buy from us"
  cards above the fold.
- UX psychology principles in use are catalogued in `docs/design-system.md`
  — Hick's, Fitts's, Miller's 7±2, Von Restorff, Anchoring, Loss aversion,
  Social proof, Default effect, Serial position, Gestalt, F-pattern,
  Recognition over recall, Endowment effect.

Custom utility classes in `app/globals.css`:

- `.label-mono` — small uppercase mono label (used for badges, table
  headers, micro-metadata)
- `.tnum` — `font-variant-numeric: tabular-nums` (every $/numeric column)
- `.border-hairline` — 1px border using `--border` token
- `.row-hover` — table-row hover surface
- `.text-3xs` — extra-small mono text
- `.h-header` — header height variable
- `.bg-surface`, `.bg-surface-raised` — layered surfaces

Component primitives live in `src/components/ui/`. Domain components go in
`src/components/{products,cart,checkout,layout,admin}/`.

---

## 12. Coding conventions (read before writing a line)

- **TypeScript strict.** No `any`. Use `unknown` + narrow with Zod or type
  guards. Lints fail the build.
- **Path alias**: `@/*` resolves to `./src/*` (see `tsconfig.json`).
- **Server-only**: any file that imports `process.env`, the Supabase admin
  client, the Stripe SDK, the Resend SDK, or an LLM SDK starts with
  `import "server-only";`. Repositories, services, controllers, actions,
  API routes, and email templates must never reach the browser bundle.
- **No comments narrating code.** Only explain non-obvious intent,
  trade-offs, or constraints. Never use comments to explain what a diff is
  doing — the commit message does that.
- **DTOs at the boundary.** Repositories return raw rows; services /
  resources convert to camelCase DTOs and resolve localized fields. UI
  never sees `snake_case`.
- **No prices from the client.** The cart can send any quantity but the
  checkout API re-prices from the DB. Same goes for coupons (re-resolve
  server-side).
- **Email failure never rolls back a paid order.** Wrap notification
  sends in `tryAsync` and log; never propagate.
- **Webhook handlers are idempotent.** `fulfilCheckoutCompleted` and
  `fulfilOrder` short-circuit on existing state.
- **Admin-only surfaces** call `requireAdmin()` at the very top of the
  page or route. Never rely on UI hiding to enforce access.
- **Never store grey-market or rights-unclear products.** The compliance
  AI agent flags these; the human admin is the final gate.

---

## 13. Sprint history (what is done)

Detailed history: [`docs/build-plan.md`](./docs/build-plan.md). Highlights:

- **Sprint 1** — Foundations: Next.js 14 + TypeScript strict, Tailwind retro
  tokens, fonts, `next-intl`, route groups, Supabase client family,
  schema/policies/seed SQL, storage + payment adapters, auth helpers,
  layouts, homepage skeleton, all MVP routes stubbed.
- **Sprint 2** — Products: admin categories CRUD, admin products CRUD,
  public products list with FTS / filters / sort / pagination, public
  product detail (gallery, tabs, specs, sticky buy bar, related, JSON-LD),
  `/categories` index + filtered slug page, cart page + live header
  counter, demo data source.
- **Sprint 3** — Checkout: cart store (Zustand + persistence), `/cart`,
  orders module, `POST /api/checkout` (re-prices server-side, creates
  Stripe Checkout session), `POST /api/webhooks/stripe` (signature-
  verified, fulfils on `checkout.session.completed`, fails on
  `payment_intent.payment_failed`), `/checkout` page with email capture,
  `/thank-you` receipt.
- **Sprint 4** — Downloads: idempotent fulfilment writes `downloads` rows,
  `GET /api/downloads/[id]` with ownership check + 15-min signed URL +
  `download_count` increment, `/library` listing with re-download buttons.
- **Sprint 5** — Admin & analytics: `/admin/orders` list + detail with
  status badges, `/admin/products/[id]/files` upload via storage adapter,
  Resend "your downloads are ready" template (en + ar), coupons module
  (CRUD + cart input + discount math), live admin dashboard backed by
  real queries.
- **Sprint 6** — Internal AI tools: `@/shared/ai` adapter trio
  (OpenAI/Anthropic/noop), `ai_jobs` repository, in-memory rate limiter,
  five agents (listing/seo/marketing/qa/compliance), `/api/ai/[task]`
  POST endpoint, `/admin/ai-tools` retro page with auto-generated forms +
  cost+latency display + history.
- **Sprint 7** — Polish & launch prep: `audit` module (best-effort
  service + repo) wired into `order.paid` and `ai.run` events,
  `/admin/audit-log` viewer with entity quick-filters,
  `GET /api/admin/orders/export` CSV streaming with audit entry per
  export, `/library/[orderId]` per-order buyer page (ownership-checked
  via `ordersController.getByIdForUser`), `/library` rows deep-link to
  per-order view, thank-you CTA opens it directly. Reviews surface:
  full `reviews` module (replaces the Sprint-1 stub) with
  buyer submit (purchase-gated, one-per-(product,user), editing
  resets to pending), `/admin/reviews` moderation queue
  (approve/hide/repend/delete), `<ProductReviews />` on every product
  page, automatic `products.rating_avg/count` recompute on
  approval-boundary crossings, audit entries for every review
  submit/moderate/delete.

Last commit on `main` after this README lands: see `git log -1`.

---

## 14. What's left for launch (work for the next agent)

The **MVP backbone is shippable**. The remaining gates are content and
operational, not architectural. Suggested ordering:

1. **Email on review approval** *(optional)* — `notifications` module
   is wired for transactional sends; add a `review.approved` template
   and call from `reviewsService.moderate` when crossing into
   `approved`.
2. **25-product launch catalogue** — content sprint. Use the `listing`,
   `seo`, `marketing` AI agents we just shipped. Run `compliance` on every
   product before publish.
3. **Stripe live keys + Resend live domain + R2 migration** — see
   `docs/ops/server-setup.md`.
4. **Legal copy review** — replace placeholder content under
   `/[locale]/(public)/legal/*` with finalised terms / privacy / refund /
   downloads / acceptable-use / DMCA.
5. **End-to-end pre-launch test plan** — happy path (browse → add → cart
   → checkout → Stripe test → webhook → library → re-download), edge
   cases (failed payment, expired signed URL, coupon limits hit, etc.).

Out of scope for the MVP (do **NOT** build now): seller onboarding,
marketplace submissions, affiliate program, mobile app, PDF watermarking,
Meilisearch / Typesense.

---

## 15. Common workflows for AI agents

> See [`AGENTS.md`](./AGENTS.md) for the full working playbook (rules,
> commit conventions, definition of done, escalation).

**Add a new domain module** — copy `src/modules/products/` as a template,
rename files, register in nothing (modules are self-contained — other
modules import via the new module's `index.ts`).

**Add a new admin page** — create `app/[locale]/admin/<name>/page.tsx`,
start with `await requireAdmin()`, render `<AdminPageHeader />`, then
call your module's controller. Add the sidebar entry to
`src/components/layout/admin-sidebar.tsx` and an `admin.nav.<name>` key
to `src/messages/{en,ar}.json`.

**Add a new buyer page** — create `app/[locale]/(public)/<name>/page.tsx`,
do data fetching in the RSC (controller call), pass DTOs to UI components
in `src/components/`. Translations in `src/messages/`.

**Add a translation** — add the key to `en.json` first, then `ar.json`.
Both files MUST stay in parity. Use `useTranslations()` in client
components, `getTranslations()` in RSC / server actions.

**Add a new env var** — add to `.env.example`, add to `src/shared/env.ts`
Zod schema, document it in this README's section 7.

**Add a new database column** — update `src/shared/db/schema.ts`
(Drizzle), update `db/schema.sql` + `db/policies.sql` to keep cold-start
working, run `npm run db:generate`. Update affected repositories +
resources + DTOs.

**Run typecheck + lint + build before every commit:**
```powershell
npm run typecheck; npm run lint; npm run build
```
All three must pass.

---

## 16. Gotchas & pitfalls

- **Supabase columns come back snake_case.** Repositories must normalise
  to camelCase explicitly. The orders repo had a latent bug here in
  Sprint 5 — search `// snake → camel` for examples.
- **Demo source vs Supabase.** When `hasSupabase()` is false, repositories
  return demo data (read-only) or empty arrays (writes). Admin pages must
  show the `<AdminBanner>` warning so the user knows they're in degraded
  mode.
- **Stripe webhook signature verification requires the RAW body**.
  `app/api/webhooks/stripe/route.ts` calls `req.text()` — do not parse
  to JSON before verifying.
- **`fulfilCheckoutCompleted` runs at most once per order.**
  `downloadsService.fulfilOrder` short-circuits if any `downloads` row
  exists for the order. Tests must rely on this.
- **AI rate limiter is in-memory.** It works on a single Vercel instance.
  When we go multi-region, swap `src/modules/ai/ai.rate-limit.ts` for a
  Redis-backed implementation with the same interface.
- **PowerShell does not support heredoc.** When committing from this
  shell, write the message to `.git/COMMIT_MSG.tmp` first, then
  `git commit -F .git/COMMIT_MSG.tmp`. Delete the file after.
- **Locale prefix is always present** (`localePrefix: 'always'`). All
  internal links go through `Link` from `@/shared/i18n/navigation`, which
  prefixes automatically. Never use `next/link` directly in pages.
- **Server-only imports.** If a file uses Supabase admin / Stripe / Resend
  / an LLM SDK, the FIRST line must be `import "server-only";`. If you
  forget, the build will succeed but bundle secrets into the browser.
- **`Result<T>` is not a promise.** Always `await` your `tryAsync`/service
  call FIRST, then destructure `.ok`. A common mistake is `if (!service.foo().ok)`
  which checks a Promise's `.ok` (always undefined).

---

## 17. Where to ask the human (escalation)

- **Production credentials** (live Stripe keys, live Resend domain, prod
  Supabase project) — must come from the human. Never invent or commit.
- **New product policy / new license type / grey-market questions** —
  human decision; the compliance agent flags but does not approve.
- **Schema changes that drop or rename columns** — human review required;
  always provide a migration AND a rollback plan.
- **Pricing decisions** for the catalogue — human; agents may suggest via
  the `listing` AI but never publish without review.

---

Built to ship products, not banners.
