# Architecture

## Why Laravel-style modules on top of Next.js?

Next.js gives us routing, RSC, and the build pipeline. It does **not**
opinionate the data flow inside a route. Without structure, server actions
sprawl, repository code leaks into components, and "where do I add this
business rule?" becomes a per-developer judgement call.

Borrowing Laravel's layering (Controller → Service → Repository, plus
FormRequests / Resources / Policies) gives the team a single answer to
that question per concern. Every module looks identical, so onboarding,
review, and refactoring scale linearly with feature count instead of
quadratically.

## Layers

```
                ┌──────────────────────────────────────┐
   request ───▶ │ app/[locale]/.../page.tsx             │  thin route shell
                │ app/api/.../route.ts                  │  thin handler
                └────────────────┬─────────────────────┘
                                 │  calls
                                 ▼
                ┌──────────────────────────────────────┐
                │ src/modules/<name>/controller.ts      │  picks up locale, unwraps Result
                └────────────────┬─────────────────────┘
                                 │  calls
                                 ▼
                ┌──────────────────────────────────────┐
                │ src/modules/<name>/service.ts         │  validates, applies policy,
                │                                       │  returns Result<T, AppError>
                └────────────────┬─────────────────────┘
                                 │  calls
                                 ▼
                ┌──────────────────────────────────────┐
                │ src/modules/<name>/repository.ts      │  ONLY file that talks to Supabase
                └──────────────────────────────────────┘
```

Output flows back through a **resource transformer** (`*.resource.ts`)
that resolves localized fields and shapes a stable DTO. The UI never sees
DB columns directly.

## What goes in `core/` vs `shared/` vs `modules/`

- `core/` — generic framework primitives that don't know about the
  business domain (Result, AppError, eventBus, pagination, logger). If
  you swapped souq for a different project, this folder would come along
  unchanged.
- `shared/` — kernel: env, db clients, storage adapter, payments adapter,
  i18n helpers, auth helpers. Project-aware but cross-cutting.
- `modules/` — the business domain (products, orders, cart, …). Each
  module is independently understandable.

## Cross-module communication

Modules **never import another module's repository**. They go through:

1. **Calling another module's controller / service** for synchronous
   queries (e.g. orders module calling `productsService.getBySlug` to
   snapshot a title at purchase time).
2. **Emitting a domain event** on `core/eventBus` for fire-and-forget
   side effects (e.g. payments emits `order.paid` and the notifications
   module listens for it).

This keeps the dependency graph a tree, not a web.

## Result<T> instead of throwing

Every service method returns `Result<T, AppError>` so the caller has to
handle both branches at the type level. Throwing is reserved for genuine
exceptions (network outage, programmer error). This makes the failure
surface auditable and removes the "did this throw?" cognitive tax from
controllers.

## Storage and payments are adapters

Both `src/shared/storage/` and `src/shared/payments/` expose interfaces.
Today the implementations are Supabase Storage and Stripe. Tomorrow we
can drop in Cloudflare R2 or PayTabs without touching call sites.
