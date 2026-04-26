# Server-side setup runbook

This document describes everything that must exist **outside the repo** for
SOUQ.GG to run end-to-end. AI agents and humans should follow it in order
when provisioning a new environment (`dev`, `staging`, `prod`).

The repo deliberately works in degraded mode without any of these — see
`README.md` § 1 — so missing one box never crashes the whole app, it just
disables the matching feature.

> **Heads up**: live keys are secrets. They live in `.env.local` (dev) or
> the host's secret manager (Vercel project settings, Supabase Edge Function
> secrets, etc.). They must NEVER be committed.

---

## 0. Inventory

| # | Service | Purpose | Required for |
| --- | --- | --- | --- |
| 1 | **Supabase** | Postgres + Auth + Storage | Catalogue persistence, sign-in, file storage |
| 2 | **Stripe** | Hosted Checkout + webhooks | Real payments + automated fulfilment |
| 3 | **Resend** | Transactional email | "Your downloads are ready" emails |
| 4 | **OpenAI** *or* **Anthropic** | LLM provider for internal AI tools | Admin-only AI agents (listing, SEO, marketing, QA, compliance) |
| 5 | **Vercel** | Frontend + API hosting | Production deploy |
| 6 | *(optional, Phase 2)* **Cloudflare R2** | Object storage migration target | Lower egress on heavy file traffic |

---

## 1. Supabase

### 1.1 Create the project

1. Sign in to <https://supabase.com>.
2. **New project** → name `souq-dev` (or `souq-prod`). Region: closest to
   your buyers — `us-east-1` works globally; `eu-west-1` if EU-heavy;
   nothing in MENA on Supabase yet.
3. Set a strong DB password and store it in your password manager.
4. Wait for the project to be provisioned (~2 min).

### 1.2 Capture the API credentials

In the Supabase dashboard → **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` ← *Project URL*
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← *anon public*
- `SUPABASE_SERVICE_ROLE_KEY` ← *service_role secret* (server-only, never
  ship to the browser)

In **Settings → Database → Connection string → "Direct connection"**:

- `DATABASE_URL` ← the `postgres://` URL (used by Drizzle Kit only)

Paste them all into `.env.local` (dev) or your host's secret store (prod).

### 1.3 Apply the canonical schema

Open the SQL Editor in Supabase. Run the files **in this exact order**
(each is idempotent and safe to re-run):

1. `db/schema.sql` — extensions, enums, tables, helper functions
   (`localized()`, `localized_tsv()`, `touch_updated_at()`,
   `handle_new_user()`), `tsvector` triggers on `products`.
2. `db/policies.sql` — `is_admin()` helper + RLS policies (default
   deny → explicit allow per table).
3. `db/seed.sql` — seven categories with bilingual names.

After step 1 you'll have all tables with empty rows. After step 2 every
table is RLS-enabled. After step 3 the categories show up in the
navigation.

### 1.4 Auth providers

Supabase **Authentication → Providers**:

- **Email**: enabled by default. Configure SMTP if you want custom-from
  emails (otherwise Supabase's default sender is used).
- **Magic Link**: enabled by default; useful for passwordless login.
- **Google OAuth** (recommended): create a Google Cloud OAuth client
  → callback `https://<project>.supabase.co/auth/v1/callback` →
  paste client ID + secret in Supabase.

Set the **Site URL** under Authentication → URL Configuration to your
public origin (`http://localhost:3000` for dev, `https://souq.gg` for
prod). Add additional redirect URLs for any preview deploys.

### 1.5 Promote yourself to admin

The `handle_new_user()` trigger creates a `profiles` row with
`role = 'buyer'` for every new signup. To grant admin:

```sql
update profiles
   set role = 'admin'
 where id = '<your-auth.users.id>';
```

You can find your `id` in Supabase → Authentication → Users.

After this, `/admin/*` works for your account. Other accounts get
`FORBIDDEN` (handled by `requireAdmin()` in `src/shared/auth/session.ts`).

### 1.6 Storage bucket

Supabase **Storage → New bucket**:

- Name: `product-files`
- Public: **OFF** (critical — buyers must never reach files via a public
  URL)
- File size limit: 524288000 (500 MB) to match the in-app cap

Object key format used by the admin upload UI:
`{productId}/{timestamp}-{safe-filename}`.

No bucket policy is needed — the service-role key bypasses RLS, and the
buyer-facing `/api/downloads/[id]` route mints short-lived signed URLs
(15 min) only after an ownership check.

### 1.7 (Optional) Backups

Supabase → **Database → Backups**: Pro plan gives daily automatic
backups + 7 days retention. Turn on point-in-time recovery for prod.

---

## 2. Stripe

### 2.1 Create the account

1. Sign in to <https://dashboard.stripe.com>. Use **test mode** for dev.
2. Switch to test mode (toggle top-right).

### 2.2 API keys

**Developers → API keys**:

- `STRIPE_SECRET_KEY` ← `sk_test_...` (dev) / `sk_live_...` (prod)

The publishable key is currently not used anywhere because we redirect
to **Stripe Hosted Checkout** (no Elements). If you ever embed Stripe
Elements, capture `pk_test_...` and add a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
env var.

### 2.3 Webhook endpoint

**Developers → Webhooks → Add endpoint**:

- Endpoint URL:
  - Local dev: tunnelled via Stripe CLI — see § 2.4
  - Prod: `https://<your-domain>/api/webhooks/stripe`
- Events to send:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`

Click **Reveal "Signing secret"** → that string is your
`STRIPE_WEBHOOK_SECRET`. Different per environment.

### 2.4 Local webhook tunnel

Install the Stripe CLI (<https://stripe.com/docs/stripe-cli>), then:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The first run prints a `whsec_...` string — that's your
`STRIPE_WEBHOOK_SECRET` for local dev. Paste it into `.env.local`.

Trigger a test event end-to-end:

```bash
# After you've placed a test order from /checkout:
stripe trigger checkout.session.completed
```

You should see:

- Webhook received in `stripe listen` output
- `[webhook.stripe] event { type: 'checkout.completed', orderId: '...' }`
  in the dev server logs
- Order flips to `paid` in `orders`
- One `downloads` row per `product_files × paid order_items`
- "Download ready" email logged via the noop mailer (or sent if Resend
  configured)

### 2.5 Going live

When you're ready for live mode:

1. Activate the live account (Stripe will ask for business details, ID,
   bank for payouts).
2. Switch the dashboard to **live mode**.
3. Capture `sk_live_...` and the live webhook signing secret.
4. Update Vercel env vars (and only the prod environment, NOT preview).
5. Create the live webhook endpoint pointing at your prod domain.
6. Test with a real $1 charge (or Stripe test cards if you're staging).

---

## 3. Resend (email)

### 3.1 Create the account

1. Sign in to <https://resend.com>.
2. **API Keys → Create API Key** with "Full access" (or "Send only" if
   that scope is enough).
3. `RESEND_API_KEY` ← that key.

If `RESEND_API_KEY` is unset the app falls back to `noopMailer`
(`src/shared/email/noop.ts`), which logs the email without sending. Paid
orders still fulfil, downloads still work — only the email is skipped.

### 3.2 Domain (prod)

For prod, add and verify your sending domain in Resend → **Domains →
Add Domain**. You'll receive DNS records (SPF, DKIM, optionally DMARC)
to add to your DNS provider. Once verified, set the `from` address used
by `notificationsService.sendDownloadReady` (currently hardcoded to
`SOUQ.GG <orders@souq.gg>` — update when the domain is finalised).

---

## 4. OpenAI / Anthropic (internal AI tools)

The AI tools page (`/admin/ai-tools`) is admin-only and powers the
listing/SEO/marketing/QA/compliance agents.

Order of preference (set whichever you have):

1. `OPENAI_API_KEY` — defaults to `gpt-4o-mini`. Get it at
   <https://platform.openai.com/api-keys>.
2. `ANTHROPIC_API_KEY` — defaults to `claude-3-5-haiku-latest`. Get it
   at <https://console.anthropic.com/settings/keys>.

If neither is set, the noop adapter returns deterministic placeholder
text and the AI tools page shows a "stub mode" banner. This is fine for
local UI work.

Cost per call is recorded in the `ai_jobs` table. The in-memory rate
limiter caps each admin × agent combo at 10 runs/minute. For
multi-instance prod deploys, swap `src/modules/ai/ai.rate-limit.ts` for
a Redis-backed implementation with the same interface.

---

## 5. Vercel (hosting)

### 5.1 Connect the repo

1. <https://vercel.com/new> → import the GitHub repo.
2. Framework: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output directory: `.next` (default).
5. Install command: `npm install` (default).
6. Node.js version: **20.x** (set in **Project Settings → General →
   Node.js Version**).

### 5.2 Environment variables

Add every variable from `.env.example` under
**Project Settings → Environment Variables**, scoped per environment
(`Production`, `Preview`, `Development`).

| Scope | Vars |
| --- | --- |
| Production | All real keys (live Stripe, Resend with verified domain, prod Supabase, OpenAI/Anthropic) |
| Preview | Test keys; same Supabase staging project; test Stripe |
| Development | Optional — local dev usually uses `.env.local` |

`NEXT_PUBLIC_*` vars are exposed to the browser. Server-only vars are
available only to server code (RSC, route handlers, server actions).

### 5.3 Domains

**Project Settings → Domains** → add `souq.gg`, `www.souq.gg`. Vercel
issues + auto-renews TLS certificates. Set DNS at your registrar:

- `souq.gg` → `A` 76.76.21.21 (Vercel)
- `www.souq.gg` → `CNAME` `cname.vercel-dns.com`

### 5.4 Stripe webhook endpoint (prod)

After the first deploy, in Stripe → **Developers → Webhooks → Add
endpoint** point a NEW (live-mode) endpoint at
`https://souq.gg/api/webhooks/stripe` with the same two events
(`checkout.session.completed`, `payment_intent.payment_failed`). Capture
the live signing secret and update `STRIPE_WEBHOOK_SECRET` in Vercel
production env.

### 5.5 Supabase auth redirect URLs

Add the prod URL(s) to Supabase → Authentication → URL Configuration →
Redirect URLs:

- `https://souq.gg/**`
- `https://*.vercel.app/**` (for preview deploys)

---

## 6. Going-live checklist

Run through this before flipping DNS and accepting real payments.

- [ ] Live Supabase project provisioned, `db/schema.sql + policies.sql +
      seed.sql` applied
- [ ] Storage bucket `product-files` created, public OFF
- [ ] Your admin account has `role = 'admin'` in `profiles`
- [ ] At least 25 published products (compliance agent green on all)
- [ ] Live Stripe account activated, payouts to a real bank
- [ ] Live Stripe webhook endpoint added, signing secret in Vercel
- [ ] Resend domain verified, `from` address updated in
      `notificationsService` if needed
- [ ] All `NEXT_PUBLIC_*` and server-only env vars set in Vercel
      Production
- [ ] DNS pointed at Vercel; TLS green
- [ ] Smoke test: browse → add → cart → checkout → real $1 → webhook →
      paid → downloads row → email received → re-download works
- [ ] Refund test: refund the $1 in Stripe → ensure downstream behaviour
      is intentional (currently order stays `paid`; rolling back access
      is a manual admin op — document this until automated)
- [ ] `/admin/*` accessible only to admin role; signed-out / buyer get
      `FORBIDDEN`
- [ ] `/api/downloads/[id]` returns 401 for unauth, 403 for non-owner,
      302 for owner
- [ ] Legal pages reviewed by counsel; placeholder content replaced
- [ ] AI tools tested with at least one real OpenAI / Anthropic call,
      cost showing up in `ai_jobs.cost_usd`
- [ ] Backups enabled in Supabase

---

## 7. Cloudflare R2 migration (Phase 2, optional)

When egress on Supabase Storage becomes painful, swap to R2 without
touching any module:

1. Implement `R2StorageAdapter` matching `src/shared/storage/types.ts`.
2. Switch the active adapter in `src/shared/storage/index.ts`.
3. Migrate existing objects with `rclone` (or AWS CLI with the R2 S3
   endpoint).
4. Update bucket name + signed URL TTL via env vars.

The buyer-facing API (`/api/downloads/[id]`) keeps working unchanged —
it just calls `storage.signedUrl(...)` which dispatches to whichever
adapter is active.

---

## 8. Where to keep operational state

- **Application secrets** — Vercel project settings (per environment) +
  `.env.local` (dev only, never committed).
- **Database** — Supabase Postgres. Backups enabled.
- **Object storage** — Supabase Storage `product-files` bucket (or R2).
- **Audit log** — `audit_log` table (UI viewer pending Sprint 7 polish).
- **Webhook secrets** — Stripe dashboard (per environment endpoint).
- **AI job cost** — `ai_jobs.cost_usd` per row; sum from the dashboard.
- **Customer data** — Supabase only; never log PII to console / logger
  destinations.

When in doubt: **the repo never holds runtime data, only the code that
shapes it.**
