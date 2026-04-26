# souq — digital products store

A retro-compact, English-first, fully translatable digital products store.
Next.js 14 + TypeScript, organised in a Laravel-inspired modular
architecture, designed to ship a 25-product MVP and grow without rewrites.

> Status — **Sprint 1 complete: foundations + shop UI**. Routes for
> `/products`, `/cart`, `/checkout`, `/library`, `/admin/*` are stubbed
> and labelled with their owning sprint.

---

## Table of contents
1. [Tech stack](#tech-stack)
2. [Architecture](#architecture)
3. [Folder layout](#folder-layout)
4. [Local setup](#local-setup)
5. [Adding a language](#adding-a-language)
6. [Design psychology](#design-psychology)
7. [Database](#database)
8. [Scripts](#scripts)
9. [Sprint roadmap](#sprint-roadmap)

---

## Tech stack
- **Framework**: Next.js 14 (App Router) + TypeScript strict
- **Styling**: Tailwind CSS, custom retro tokens, `class-variance-authority`
- **i18n**: `next-intl` (English default, Arabic translated, RTL-aware,
  generic locale registry)
- **State**: Zustand (client), TanStack Query (server-fetch)
- **Forms**: React Hook Form + Zod
- **DB**: Supabase (Postgres + Auth + Storage), Drizzle ORM
- **Payments**: Stripe (primary), MENA fallbacks via adapter
- **Email**: Resend
- **AI** (admin only): OpenAI + Anthropic SDKs
- **Hosting**: Vercel + Supabase

## Architecture

The codebase follows a **Laravel-inspired layered modular architecture** on
top of Next.js. Routes are thin: they call a controller, the controller
calls a service, and the service is the only thing that touches a
repository.

```
   request          ──→  app/[locale]/.../page.tsx          (route shell)
                    ──→  src/modules/<name>/controller       (entry point)
                    ──→  src/modules/<name>/service          (business logic + Result<T>)
                    ──→  src/modules/<name>/repository       (Supabase / Drizzle)
                    ──→  src/modules/<name>/resource         (DTO transformer)
   response         ←──  locale-aware DTO consumed by the UI
```

Each module ships:

| File | Role | Laravel parallel |
| --- | --- | --- |
| `*.controller.ts` | Thin entry point called by routes / actions | Controller |
| `*.service.ts` | Business logic, returns `Result<T, AppError>` | Service / Action |
| `*.repository.ts` | Only file that talks to the database | Eloquent / Repository |
| `*.schema.ts` | Zod input DTOs (forms / query params) | FormRequest |
| `*.resource.ts` | Output DTO + locale resolution | API Resource |
| `*.policy.ts` | Authorization rules | Policy |
| `*.types.ts` | Domain types re-exported from the schema | — |
| `index.ts` | Public surface for other modules | Service Provider |

Cross-module work happens through **`src/core/events.ts`** (typed in-process
event bus) so no module imports another module's repository.

## Folder layout

```
app/                              ← Next.js routes only (thin shells)
  [locale]/
    layout.tsx                    ← root layout per locale (html/body)
    (public)/                     ← buyer-facing routes
    (auth)/                       ← sign-in / sign-up / forgot
    admin/                        ← admin routes (gated by RLS + role)
  api/
    webhooks/stripe/route.ts

src/
  core/                           ← framework primitives
    result.ts                     Result<T, AppError>
    errors.ts                     AppError + factory helpers
    events.ts                     typed domain event bus
    pagination.ts                 PageQuery + Page<T>
    logger.ts                     structured logger

  shared/                         ← cross-cutting kernel
    env.ts                        Zod-validated process.env
    utils.ts                      cn / formatPrice / slugify / …
    auth/session.ts               getSessionUser / requireUser / requireAdmin
    db/
      schema.ts                   Drizzle schema (TS source of truth)
      client.ts                   Drizzle client (server-only)
      supabase/
        client.ts                 browser client
        server.ts                 SSR client (RLS)
        admin.ts                  service-role client (bypass RLS)
        middleware.ts             session refresh
        stub.ts                   no-op when env vars missing
    storage/                      StorageAdapter + Supabase impl
    payments/                     PaymentProviderAdapter + Stripe impl
    i18n/
      locales.ts                  LOCALES registry (the only file you edit
                                  to add a language)
      routing.ts                  next-intl routing config
      navigation.ts               typed Link / redirect / useRouter
      request.ts                  server-side message loader
      localized-field.ts          tField() — read JSONB localized values

  modules/                        ← domain modules (Laravel-style)
    products/                     full stack (reference module)
    categories/                   full stack
    cart/                         Zustand store + selectors
    auth/                         session + role checks
    orders/ coupons/ downloads/ reviews/ ai/ notifications/ audit/

  components/
    ui/                           primitives (Button, Input, Badge, Card)
    layout/                       Header, Footer, Sidebar, LocaleSwitcher
    products/                     domain-specific (Price, Rating, Table, Filter)

  messages/
    en.json                       source of truth
    ar.json                       translation

db/                               canonical SQL (run against Supabase)
  schema.sql                      tables, enums, FTS triggers
  policies.sql                    RLS policies
  seed.sql                        initial categories
  migrations/                     drizzle-kit output

docs/                             architecture + design + product policy
agents/                           internal AI agent specs
```

## Local setup

```bash
git clone <repo>
cd souq.v3
cp .env.example .env.local
npm install
npm run dev
```

The app boots on `http://localhost:3000`. **You don't need Supabase or
Stripe keys to see the UI** — repositories return empty result sets when
env vars are missing. As soon as you fill `.env.local`, the real clients
take over with no code change.

When you're ready to wire the database:

1. Create a Supabase project, paste URL + anon key + service-role key into
   `.env.local`.
2. Run the SQL files **in this order** in the Supabase SQL editor:
   `db/schema.sql` → `db/policies.sql` → `db/seed.sql`.
3. Set `DATABASE_URL` (the direct connection string) and run
   `npm run db:generate` to keep Drizzle migrations in sync.

## Adding a language

The whole point of the i18n design is that adding a third language is a
**three-step change with no schema migration**.

1. **Register the locale** — append one entry to `src/shared/i18n/locales.ts`:

   ```ts
   { code: "fr", label: "Français", dir: "ltr", font: "sans", intlTag: "fr-FR" }
   ```

2. **Drop a translation file** — create `src/messages/fr.json` (clone
   `en.json` and translate the values). All existing routes pick it up
   automatically; missing keys gracefully fall back to English.

3. **Translate product content** — for each product/category, add the new
   locale key to the JSONB columns:

   ```sql
   update products
   set title = title || jsonb_build_object('fr', 'Modèle Notion 2026')
   where slug = 'notion-template-2026';
   ```

   The `tField()` helper falls back to English until you do this, so the
   site never breaks.

That's it — the language switcher, RTL handling, font swapping, URL
prefixing, and full-text search all read from the registry.

## Design psychology

The UI is intentionally retro-compact and product-centric. Every choice
maps to a documented psychological principle:

| Principle | Where it shows up |
| --- | --- |
| **Hick's law** | Header has ≤7 items; nav links are inline + minimal |
| **Fitts's law** | Primary CTA buttons are 36px tall; cart/account targets are corner-adjacent |
| **Miller's 7±2** | Filter groups capped at ~7 visible options before a "more" link |
| **Von Restorff** | Single terracotta accent across an otherwise monochrome interface |
| **Anchoring** | `compare_at` price shown left of current price as a strikethrough |
| **Loss aversion** | Discount % rendered as `−25%` next to price |
| **Social proof** | Sales count + rating column visible on every row |
| **Default effect** | Sort defaults to "Best selling" (also the leftmost option) |
| **Serial position** | Most persuasive stat (satisfaction) goes last in the strip |
| **Gestalt — proximity** | Related metadata (price + savings + license) grouped tight |
| **Gestalt — continuity** | Tabular alignment with `font-variant-numeric: tabular-nums` |
| **F-pattern reading** | Title → type → lang → price laid out left-to-right |
| **Recognition over recall** | ⌘K hint visible inside the search input |
| **Endowment effect** | Cart persists across sessions (Zustand + localStorage) |

The homepage is **the shop** — no hero, no banner, no "why buy from us"
cards above the fold. Stats strip → category chips → sort/filter →
dense product table. That's the whole page.

## Database

- **Localized fields are JSONB** (`{ "en": "...", "ar": "..." }`) so adding
  a language never requires a schema change.
- **Full-text search** uses a single locale-agnostic `tsvector` column
  rebuilt by trigger from every locale present — works for any future
  language with zero config.
- **Row-Level Security on every table**, default-deny → explicit allow.
- See `db/schema.sql` for the canonical DDL, `db/policies.sql` for RLS,
  `db/seed.sql` for the initial 7 categories.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (Next.js preset) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |
| `npm run db:generate` | Drizzle Kit — generate SQL migrations |
| `npm run db:push` | Drizzle Kit — push schema directly |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## Sprint roadmap

| Sprint | Scope | Status |
| --- | --- | --- |
| 1 | Foundations: i18n, schema, modular architecture, shop UI | ✅ |
| 2 | Admin catalogue + Checkout & Payments | ⏳ |
| 3 | Library & Delivery (signed URLs) | ⏳ |
| 4 | Merchandising (bundles, coupons, anchoring) | ⏳ |
| 5 | Analytics + buyer dashboard | ⏳ |
| 6 | Internal AI tools (admin-only agents) | ⏳ |
| 7 | Launch hardening (SEO, perf, RTL polish, Arabic content review) | ⏳ |

---

Built to ship products, not banners.
