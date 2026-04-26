# AGENTS.md — Working playbook for AI coding agents

You are picking up a private Next.js + TypeScript codebase that ships an
Arabic-first digital products store (SOUQ.GG). The full project context,
architecture, env vars, schema, routes, and sprint history live in
[`README.md`](./README.md) — **read it once before doing anything**.

This file is the operational playbook: rules of engagement, conventions,
common workflows, and the definition of done.

---

## 0. Mental model in 60 seconds

- The repo is **MVP-complete on the architectural level** (Sprints 1–6).
  What's left is content, polish, and operational launch prep.
- Code follows **Laravel-inspired layered modules** on top of Next.js
  App Router. Routes are thin shells; controllers / services / repositories
  do the work. Cross-module imports go through `index.ts` barrels — never
  reach into another module's repository.
- Every service method returns `Result<T, AppError>`. Throw only for truly
  exceptional things.
- Localized strings live in JSONB (`{ "en": "...", "ar": "..." }`) so
  adding a third language never touches the schema.
- Buyer-facing prices, coupons, and entitlements are ALWAYS re-resolved
  server-side. Never trust the client.
- Admin surfaces always start with `await requireAdmin()`.
- **Never sell or position grey-market content.** The compliance AI agent
  flags ambiguous listings; the human admin is the final gate.

---

## 1. Hard rules (do not violate)

1. **No grey-market positioning.** Don't add features, copy, or seed data
   that markets the store as a place for cheap regional keys, leaked
   content, or rights-unclear material. Block at the AI level if needed
   (compliance agent).
2. **No prices, totals, or discounts trusted from the client.** Always
   re-resolve server-side from the DB.
3. **No public URLs for `product_files`.** All buyer access goes through
   `GET /api/downloads/[id]` which checks ownership, then mints a
   short-lived signed URL.
4. **Webhook handlers are idempotent.** Do not roll back paid orders on
   downstream failures (email, downloads). Log + continue.
5. **Server-only modules must import `"server-only";` first.** Anything
   that touches Supabase admin / Stripe / Resend / an LLM SDK. Forgetting
   this leaks secrets into the browser bundle.
6. **No hard-coded user-visible strings.** Add to `src/messages/en.json`
   AND `src/messages/ar.json` (parity required), then call via
   `useTranslations()` / `getTranslations()`.
7. **Never commit `.env.local`, real keys, real customer data, or
   `node_modules/` / `.next/` / `tsconfig.tsbuildinfo`.** The `.gitignore`
   already covers these — don't override.
8. **Never `git push --force` to `main`.** Never amend a commit you've
   already pushed unless the human asked.
9. **Never disable RLS or grant public read on `product_files`,
   `coupons`, `ai_jobs`, `audit_log`.** These are admin-only by design.
10. **Strict TypeScript.** `any` is forbidden. Lints fail the build.

---

## 2. Definition of done

A change is "done" when **all** of these are true:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (0 warnings, 0 errors)
- [ ] `npm run build` succeeds
- [ ] Affected admin pages still render in both en and ar locales
- [ ] If you added a translation key, it exists in BOTH `en.json` and
      `ar.json`
- [ ] If you added an env var, it's in `.env.example` AND in the Zod
      schema in `src/shared/env.ts` AND documented in README § 7
- [ ] If you touched the DB schema: Drizzle (`schema.ts`) AND canonical
      SQL (`db/schema.sql`, `db/policies.sql`) are both updated
- [ ] No `console.log` left behind (use `logger("module-name")` from
      `@/core/logger`)
- [ ] No `// TODO` without a follow-up issue / sprint task captured in
      `docs/build-plan.md`
- [ ] Commit message follows the convention in § 5 below

Run them in this order, each in parallel where possible:

```powershell
npm run typecheck
npm run lint
npm run build
```

If `npm run build` fails on a route you didn't touch, do not "fix" it by
disabling the route — find the regression. Most failures are in
`src/messages/*.json` parity drift.

---

## 3. Standard workflows

### 3.1 Add a new feature in an existing module

1. Identify which module owns it (see README § 4 table).
2. If it needs a new DB column → update `src/shared/db/schema.ts`,
   `db/schema.sql`, `db/policies.sql`. Run `npm run db:generate`.
3. Add validation to `<module>.schema.ts` (Zod).
4. Add business logic to `<module>.service.ts` returning `Result<T>`.
5. Add a thin entry in `<module>.controller.ts` if the UI needs to call it.
6. If the UI is a form: add a `<module>.actions.ts` server action wired to
   `useFormState` + a client form component under `src/components/<area>/`.
7. Add translations (`en.json` + `ar.json`).
8. Add the route in `app/[locale]/<area>/...` if needed.
9. Run the full DoD checklist (§ 2).

### 3.2 Add a new module

1. Copy `src/modules/products/` as a template (it's the reference module).
2. Rename files (`<name>.controller.ts`, etc.).
3. Replace types and Zod schemas.
4. Update the `index.ts` barrel exports.
5. Wire in routes/actions as needed.
6. Add translations.
7. Document the module in README § 4.
8. Add a sprint entry in `docs/build-plan.md`.

### 3.3 Add a new admin page

```tsx
// app/[locale]/admin/<name>/page.tsx
import { setRequestLocale, getTranslations } from "next-intl/server";

import { AdminBanner } from "@/components/layout/admin-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { hasSupabase } from "@/shared/db/has-supabase";
import { requireAdmin } from "@/shared/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminFooPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(); // hard gate
  const t = await getTranslations();
  const supabaseReady = hasSupabase();

  // const data = supabaseReady ? await fooController.list() : [];

  return (
    <div className="container py-3 space-y-3">
      <AdminPageHeader
        title={t("admin.nav.foo")}
        subtitle={t("admin.foo.subtitle")}
      />
      {!supabaseReady ? (
        <AdminBanner
          title={t("admin.banner.dbMissing.title")}
          body={t("admin.banner.dbMissing.body")}
        />
      ) : null}
      {/* … */}
    </div>
  );
}
```

Then:
- Add `{ href: "/admin/foo", icon: Foo, key: "foo" }` to
  `src/components/layout/admin-sidebar.tsx`.
- Add `"admin.nav.foo"` to both message files.
- Add `"admin.foo.subtitle"` (and any other keys you used) to both files.

### 3.4 Add a new buyer page

```tsx
// app/[locale]/(public)/<name>/page.tsx
import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function FooPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // const dto = await fooController.findBySlug(...);
  return (
    <div className="container py-4 space-y-3">
      {/* … */}
    </div>
  );
}
```

Internal links: `import { Link } from "@/shared/i18n/navigation";` — never
import `Link` from `next/link` directly (it skips the locale prefix).

### 3.5 Add a translation key

1. Open `src/messages/en.json`, add the key under the right namespace
   (`common.*`, `nav.*`, `shop.*`, `cart.*`, `admin.*`, `errors.*`, …).
2. Open `src/messages/ar.json`, add the SAME key with the Arabic value.
3. Use `t("...")` in client components via `useTranslations()` or in RSC
   via `getTranslations()` (next-intl).

Parity drift between `en.json` and `ar.json` will surface as missing
translations in the UI but will NOT fail the build — be diligent.

### 3.6 Add an env var

1. Add to `.env.example` with a comment.
2. Add to the Zod schema in `src/shared/env.ts` (with `.optional()`
   unless the app cannot boot without it).
3. Read it via `env.YOUR_VAR` (server) or `publicEnv.yourVar` (browser-
   safe public ones).
4. Document it in README § 7.
5. If it's a secret, also add to Vercel project settings + Supabase Edge
   secrets if used there.

### 3.7 Add a new database column

1. Update `src/shared/db/schema.ts` (Drizzle).
2. Update `db/schema.sql` to keep cold-start setup correct.
3. Update `db/policies.sql` if it changes RLS semantics.
4. `npm run db:generate` — Drizzle Kit writes a migration into
   `db/migrations/`.
5. Update affected repository to read/write the column (remember
   snake_case → camelCase conversion).
6. Update affected resource (DTO transformer) and types.
7. If the column is user-visible: update the admin form, validation
   schema, translations.

### 3.8 Add a new AI agent

1. Create `src/modules/ai/agents/<name>.ts` with:
   - `<name>Descriptor: AiAgentDescriptor`
   - `<name>InputSchema: ZodSchema`
   - `<name>OutputSchema: ZodSchema`
   - `build<Name>Prompt(input): LlmCompletionInput`
2. Add `"<name>"` to `AiAgentId` union in `src/modules/ai/ai.types.ts`.
3. Register in `src/modules/ai/agents/index.ts` (`AGENT_IDS` + the
   `AGENTS` map).
4. Add translations: `admin.ai.agent.<name>` and
   `admin.ai.agent.<name>.desc` to both message files.
5. The UI picks it up automatically — no `/admin/ai-tools` changes needed.

---

## 4. Tools you should prefer

- **Search code** → ripgrep (`rg`) or your IDE's grep, scoped tightly.
  Avoid `find`.
- **Read files** → IDE read tools, not `cat`.
- **Edit files** → IDE diff/edit tools, not `sed`/`awk`.
- **Run commands** → terminal. PowerShell is the active shell — see
  README § 16 about heredoc.
- **Type-check / lint / build** → run before finishing any task.

When the answer to a question is a single grep away, just grep. When it
requires understanding multi-module flow, read README § 4 first, then
the relevant module's `service.ts`.

---

## 5. Commit conventions

Format: `type(scope): short summary` for the title, then a body.

- `type` ∈ `feat | fix | refactor | docs | chore | test`
- `scope` is usually the sprint or module: `sprint-7`, `orders`, `ai`,
  `docs`, `db`.
- The body explains the WHY, not the WHAT (the diff is the what).
- Use bullet points liberally. Past commit messages in `git log` are a
  good template.

Example:

```
feat(sprint-6): internal AI tools — adapters, agents, jobs, admin UI

Ships an admin-only AI workspace under /admin/ai-tools, fully wired
through a single pipeline: validate → rate-limit → log → call LLM →
parse → persist. Buyer-facing surfaces never touch this module.

@/shared/ai
- Adapter trio: OpenAI (gpt-4o-mini default), Anthropic (claude-3-5-
  haiku-latest default), and a deterministic noop fallback so local
  dev works without an API key.
…
```

PowerShell-friendly commit (heredoc not supported):

```powershell
# Write the message to a temp file first
git add -A
git commit -F .git/COMMIT_MSG.tmp
# Then delete .git/COMMIT_MSG.tmp
```

Never:

- `git push --force` to `main`
- `git rebase -i` (interactive flags don't work in this environment)
- amend a pushed commit unless the human asked
- skip pre-commit hooks (`--no-verify`)

---

## 6. When to ask the human

Stop and ask if any of these are true:

- The change requires a production secret you don't have (live Stripe
  key, prod Supabase project, etc.).
- The change drops or renames a DB column / breaks a public API.
- The change touches `db/policies.sql` semantics (RLS).
- The change introduces a new external service (e.g. Redis, a search
  engine, a CDN).
- The compliance AI agent flags a product as grey-market and the human
  hasn't given an exception.
- You hit conflicting requirements between this file, `README.md`, and
  the user's prompt — the user's prompt wins, but flag it.

---

## 7. Files you should rarely touch

- `src/shared/db/schema.ts` — only with a matching SQL migration.
- `db/policies.sql` — RLS is security-critical; double-check with the
  human if you change defaults.
- `next.config.mjs`, `middleware.ts`, `tailwind.config.ts` — load-bearing.
  Touch only when the feature genuinely needs it.
- `src/shared/i18n/locales.ts` — adds a real new locale; don't fork the
  shape.
- `package.json` deps — add only what you use; pin to current major;
  run `npm install` and commit `package-lock.json`.

---

## 8. Quick links

- Project overview, env, modules, routes, schema → [`README.md`](./README.md)
- Sprint history + what's next → [`docs/build-plan.md`](./docs/build-plan.md)
- Server-side provisioning (Supabase, Stripe, Resend, Vercel) →
  [`docs/ops/server-setup.md`](./docs/ops/server-setup.md)
- Layered architecture deep-dive → [`docs/architecture.md`](./docs/architecture.md)
- Design tokens + UX psychology → [`docs/design-system.md`](./docs/design-system.md)
- Adding a language → [`docs/add-a-language.md`](./docs/add-a-language.md)
- Product policy (what we sell / don't) → [`docs/product-policy.md`](./docs/product-policy.md)
- Per-agent specs (markdown briefs the AI agents in this app implement) →
  [`agents/`](./agents/)

Welcome to the team. Ship products, not banners.
