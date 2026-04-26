-- ============================================================================
-- Row-Level Security policies. Default deny, then explicit allow.
-- Helper: is_admin() — true when the calling JWT belongs to an admin profile.
-- ============================================================================

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----- profiles -------------------------------------------------------------
alter table profiles enable row level security;

drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

drop policy if exists profiles_admin_all on profiles;
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- ----- categories (public read, admin write) --------------------------------
alter table categories enable row level security;

drop policy if exists categories_public_select on categories;
create policy categories_public_select on categories
  for select using (true);

drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories
  for all using (is_admin()) with check (is_admin());

-- ----- products (public reads only published, admins all) -------------------
alter table products enable row level security;

drop policy if exists products_public_select on products;
create policy products_public_select on products
  for select using (status = 'published' or is_admin());

drop policy if exists products_admin_write on products;
create policy products_admin_write on products
  for all using (is_admin()) with check (is_admin());

-- ----- product_files (admin only — never public) ----------------------------
alter table product_files enable row level security;

drop policy if exists product_files_admin_all on product_files;
create policy product_files_admin_all on product_files
  for all using (is_admin()) with check (is_admin());

-- buyers cannot read storage paths directly; they hit the signed-URL route
-- which uses the service role to validate ownership before responding.

-- ----- orders ---------------------------------------------------------------
alter table orders enable row level security;

drop policy if exists orders_owner_select on orders;
create policy orders_owner_select on orders
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists orders_admin_write on orders;
create policy orders_admin_write on orders
  for all using (is_admin()) with check (is_admin());

-- ----- order_items (visible if you own the parent order) --------------------
alter table order_items enable row level security;

drop policy if exists order_items_owner_select on order_items;
create policy order_items_owner_select on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and (o.user_id = auth.uid() or is_admin())
    )
  );

drop policy if exists order_items_admin_write on order_items;
create policy order_items_admin_write on order_items
  for all using (is_admin()) with check (is_admin());

-- ----- downloads (owner sees their entitlements) ----------------------------
alter table downloads enable row level security;

drop policy if exists downloads_owner_select on downloads;
create policy downloads_owner_select on downloads
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists downloads_admin_write on downloads;
create policy downloads_admin_write on downloads
  for all using (is_admin()) with check (is_admin());

-- ----- coupons (admin only — no leaking active codes) -----------------------
alter table coupons enable row level security;

drop policy if exists coupons_admin_all on coupons;
create policy coupons_admin_all on coupons
  for all using (is_admin()) with check (is_admin());

-- ----- reviews (public reads approved; users edit their own) ----------------
alter table reviews enable row level security;

drop policy if exists reviews_public_select on reviews;
create policy reviews_public_select on reviews
  for select using (status = 'approved' or auth.uid() = user_id or is_admin());

drop policy if exists reviews_owner_write on reviews;
create policy reviews_owner_write on reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists reviews_owner_update on reviews;
create policy reviews_owner_update on reviews
  for update using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

drop policy if exists reviews_admin_delete on reviews;
create policy reviews_admin_delete on reviews
  for delete using (is_admin());

-- ----- ai_jobs (admin only — internal tools) --------------------------------
alter table ai_jobs enable row level security;

drop policy if exists ai_jobs_admin_all on ai_jobs;
create policy ai_jobs_admin_all on ai_jobs
  for all using (is_admin()) with check (is_admin());

-- ----- audit_log (admin only) -----------------------------------------------
alter table audit_log enable row level security;

drop policy if exists audit_log_admin_all on audit_log;
create policy audit_log_admin_all on audit_log
  for all using (is_admin()) with check (is_admin());

-- ----- newsletter (insert-only for anyone, read for admin) ------------------
alter table newsletter_subscribers enable row level security;

drop policy if exists newsletter_public_insert on newsletter_subscribers;
create policy newsletter_public_insert on newsletter_subscribers
  for insert with check (true);

drop policy if exists newsletter_admin_select on newsletter_subscribers;
create policy newsletter_admin_select on newsletter_subscribers
  for select using (is_admin());

drop policy if exists newsletter_admin_write on newsletter_subscribers;
create policy newsletter_admin_write on newsletter_subscribers
  for update using (is_admin()) with check (is_admin());
