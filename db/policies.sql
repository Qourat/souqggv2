-- ============================================================================
-- Row-Level Security policies have been DEPRECATED for production souq.v3.
--
-- Authorization is now enforced entirely at the application layer:
--   - requireAdmin() in controllers / server actions
--   - requireUser() for buyer-protected routes
--   - Repository queries use the Drizzle client (RLS-free)
--
-- This eliminates Supabase dependency while keeping security through
-- explicit code review and typed permission checks.
-- ============================================================================

-- Legacy functions kept for schema compatibility (no-op)
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select false;
$$;
